"""
Queue service for DocuSense AI
Handles analysis queue management and processing
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
import logging

from ..models.queue import QueueItem, QueueStatus, QueuePriority
from ..models.analysis import Analysis, AnalysisStatus
from ..models.file import File, FileStatus
from .ai_service import AIService
from .file_service import FileService

logger = logging.getLogger(__name__)


class QueueService:
    """Service for queue management and processing"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService(db)
        self.file_service = FileService(db)
        self.is_processing = False
        self.max_concurrent = 3
        self.current_tasks = []

    def add_to_queue(
        self,
        analysis_id: int,
        priority: QueuePriority = QueuePriority.NORMAL
    ) -> QueueItem:
        """
        Add an analysis to the queue
        """
        try:
            # Check if analysis exists
            analysis = self.db.query(Analysis).filter(
                Analysis.id == analysis_id).first()
            if not analysis:
                raise ValueError(f"Analysis {analysis_id} not found")

            # Check if already in queue
            existing = self.db.query(QueueItem).filter(
                QueueItem.analysis_id == analysis_id
            ).first()

            if existing:
                logger.warning(f"Analysis {analysis_id} already in queue")
                return existing

            # Create queue item
            queue_item = QueueItem(
                analysis_id=analysis_id,
                priority=priority,
                status=QueueStatus.PENDING,
                total_steps=3  # Extract, Analyze, Save
            )

            self.db.add(queue_item)
            self.db.commit()
            self.db.refresh(queue_item)

            logger.info(
                f"Added analysis {analysis_id} to queue with priority {priority}")
            return queue_item

        except Exception as e:
            logger.error(f"Error adding to queue: {str(e)}")
            self.db.rollback()
            raise

    def get_queue_items(
        self,
        status: Optional[QueueStatus] = None,
        priority: Optional[QueuePriority] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[QueueItem]:
        """
        Get queue items with filtering
        """
        query = self.db.query(QueueItem)

        if status:
            query = query.filter(QueueItem.status == status)

        if priority:
            query = query.filter(QueueItem.priority == priority)

        return query.order_by(
            desc(QueueItem.priority),
            QueueItem.created_at
        ).offset(offset).limit(limit).all()

    def get_queue_status(self) -> Dict[str, Any]:
        """
        Get queue status and statistics
        """
        try:
            total_items = self.db.query(QueueItem).count()
            processing_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PROCESSING
            ).count()
            pending_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PENDING
            ).count()
            completed_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.COMPLETED
            ).count()
            failed_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.FAILED
            ).count()

            # Calculate average wait time
            completed_recently = self.db.query(QueueItem).filter(
                and_(
                    QueueItem.status == QueueStatus.COMPLETED,
                    QueueItem.completed_at >= datetime.now() -
                    timedelta(
                        hours=1))).all()

            if completed_recently:
                avg_wait_time = sum(
                    (item.completed_at - item.created_at).total_seconds()
                    for item in completed_recently
                ) / len(completed_recently)
            else:
                avg_wait_time = None

            return {
                "total_items": total_items,
                "processing_items": processing_items,
                "pending_items": pending_items,
                "completed_items": completed_items,
                "failed_items": failed_items,
                "average_wait_time": avg_wait_time,
                "is_processing": self.is_processing,
                "current_tasks": len(self.current_tasks)
            }

        except Exception as e:
            logger.error(f"Error getting queue status: {str(e)}")
            # En cas d'échec de la base, retourner un statut par défaut
            return {
                "total_items": 0,
                "processing_items": 0,
                "pending_items": 0,
                "completed_items": 0,
                "failed_items": 0,
                "average_wait_time": None,
                "is_processing": False,
                "current_tasks": 0,
                "database_error": True,
                "message": "Base de données temporairement indisponible"
            }

    async def start_processing(self):
        """
        Start the queue processing loop
        """
        if self.is_processing:
            logger.warning("Queue processing already started")
            return

        self.is_processing = True
        logger.info("Starting queue processing")

        try:
            while self.is_processing:
                await self._process_queue()
                await asyncio.sleep(2)  # Check every 2 seconds
        except Exception as e:
            logger.error(f"Error in queue processing: {str(e)}")
        finally:
            self.is_processing = False
            logger.info("Queue processing stopped")

    def stop_processing(self):
        """
        Stop the queue processing loop
        """
        self.is_processing = False
        logger.info("Stopping queue processing")

    async def _process_queue(self):
        """
        Process pending queue items
        """
        try:
            # Get pending items ordered by priority
            pending_items = self.get_queue_items(status=QueueStatus.PENDING)

            # Process up to max_concurrent items
            processing_count = len(self.current_tasks)
            available_slots = self.max_concurrent - processing_count

            for item in pending_items[:available_slots]:
                if not self.is_processing:
                    break

                # Start processing this item
                task = asyncio.create_task(self._process_item(item))
                self.current_tasks.append(task)

                # Update item status
                item.status = QueueStatus.PROCESSING
                item.started_at = datetime.now()
                self.db.commit()

                logger.info(f"Started processing queue item {item.id}")

            # Clean up completed tasks
            self.current_tasks = [
                task for task in self.current_tasks if not task.done()]

        except Exception as e:
            logger.error(f"Error processing queue: {str(e)}")
            # En cas d'échec de la base, continuer sans traiter
            await asyncio.sleep(5)  # Attendre un peu avant de réessayer

    async def _process_item(self, queue_item: QueueItem):
        """
        Process a single queue item
        """
        try:
            # Get the analysis
            analysis = self.db.query(Analysis).filter(
                Analysis.id == queue_item.analysis_id
            ).first()

            if not analysis:
                raise ValueError(
                    f"Analysis {
                        queue_item.analysis_id} not found")

            # Get the file
            file = self.db.query(File).filter(
                File.id == analysis.file_id).first()
            if not file:
                raise ValueError(f"File {analysis.file_id} not found")

            # Mark analysis as started
            analysis.started_at = datetime.now()
            self.db.commit()

            # Update progress
            queue_item.progress = 0.33
            queue_item.current_step = "Extracting text"
            self.db.commit()

            # Step 1: Extract text if needed
            if not file.extracted_text:
                # OCR/text extraction will be implemented in future version
                file.extracted_text = f"Extracted text from {file.name}"
                self.db.commit()

            # Update progress
            queue_item.progress = 0.66
            queue_item.current_step = "Analyzing with AI"
            self.db.commit()

            # Step 2: Analyze with AI
            if file.extracted_text:
                result = await self.ai_service.analyze_text(
                    text=file.extracted_text,
                    analysis_type=analysis.analysis_type,
                    provider=analysis.provider,
                    model=analysis.model
                )

                # Update analysis result and metadata
                analysis.result = result["result"]
                analysis.analysis_metadata = {
                    "provider": result.get("provider"),
                    "model": result.get("model"),
                    "processing_time": result.get("processing_time"),
                    "tokens_used": result.get("tokens_used"),
                    "estimated_cost": result.get("estimated_cost"),
                    "timestamp": result.get("timestamp")
                }
                analysis.status = AnalysisStatus.COMPLETED
                analysis.completed_at = datetime.now()

                # Update file status and metadata
                file.status = FileStatus.COMPLETED
                file.analysis_result = result["result"]
                file.analysis_metadata = {
                    "provider": result.get("provider"),
                    "model": result.get("model"),
                    "processing_time": result.get("processing_time"),
                    "tokens_used": result.get("tokens_used"),
                    "estimated_cost": result.get("estimated_cost"),
                    "timestamp": result.get("timestamp"),
                    "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
                    "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None
                }

                # Update queue item
                queue_item.status = QueueStatus.COMPLETED
                queue_item.progress = 1.0
                queue_item.current_step = "Completed"
                queue_item.completed_at = datetime.now()

                self.db.commit()

                logger.info(f"Completed processing queue item {queue_item.id}")

        except Exception as e:
            logger.error(
                f"Error processing queue item {
                    queue_item.id}: {
                    str(e)}")

            # Update error status
            queue_item.status = QueueStatus.FAILED
            queue_item.error_message = str(e)
            queue_item.retry_count += 1

            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)

            file.status = FileStatus.FAILED
            file.error_message = str(e)

            self.db.commit()

    def clear_queue(self, status: Optional[QueueStatus] = None):
        """
        Clear queue items
        """
        try:
            query = self.db.query(QueueItem)

            if status:
                query = query.filter(QueueItem.status == status)

            count = query.delete()
            self.db.commit()

            logger.info(f"Cleared {count} queue items")
            return count

        except Exception as e:
            logger.error(f"Error clearing queue: {str(e)}")
            self.db.rollback()
            raise

    def retry_failed_items(self, item_ids: Optional[List[int]] = None):
        """
        Retry failed queue items
        """
        try:
            query = self.db.query(QueueItem)

            if item_ids:
                query = query.filter(QueueItem.id.in_(item_ids))
            else:
                query = query.filter(QueueItem.status == QueueStatus.FAILED)

            count = query.update({
                QueueItem.status: QueueStatus.PENDING,
                QueueItem.error_message: None,
                QueueItem.progress: 0.0,
                QueueItem.current_step: None
            })
            self.db.commit()

            logger.info(f"Retried {count} failed queue items")
            return count

        except Exception as e:
            logger.error(f"Error retrying failed items: {str(e)}")
            self.db.rollback()
            raise
