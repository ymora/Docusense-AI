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

from ..core.database import get_db
from ..models.queue import QueueItem, QueueStatus, QueuePriority
from ..models.analysis import Analysis, AnalysisStatus, AnalysisType
from ..models.file import File, FileStatus
from .ai_service import get_ai_service
from .ocr_service import OCRService

logger = logging.getLogger(__name__)


class QueueService:
    """Service for managing analysis queue"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = get_ai_service(db)
        self.ocr_service = OCRService(db)
        self.is_processing = False
        self.processing_task = None

    def add_to_queue(
        self,
        analysis_id: int,
        priority: QueuePriority = QueuePriority.NORMAL
    ) -> QueueItem:
        """Add analysis to queue"""
        try:
            # Validate analysis exists
            self._validate_analysis_exists(analysis_id)
            
            # Check for duplicate
            self._check_duplicate_queue_item(analysis_id)
            
            # Create queue item
            queue_item = self._create_queue_item(analysis_id, priority)
            
            # Save to database
            self._save_queue_item(queue_item)
            
            logger.info(f"Added analysis {analysis_id} to queue with priority {priority}")
            return queue_item
            
        except Exception as e:
            logger.error(f"Error adding to queue: {str(e)}")
            raise

    def _validate_analysis_exists(self, analysis_id: int) -> None:
        """Validate that analysis exists"""
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis {analysis_id} not found")

    def _check_duplicate_queue_item(self, analysis_id: int) -> None:
        """Check for duplicate queue items"""
        existing = self.db.query(QueueItem).filter(
            QueueItem.analysis_id == analysis_id,
            QueueItem.status.in_([QueueStatus.PENDING, QueueStatus.PROCESSING])
        ).first()
        
        if existing:
            raise ValueError(f"Analysis {analysis_id} already in queue")

    def _create_queue_item(self, analysis_id: int, priority: QueuePriority) -> QueueItem:
        """Create new queue item"""
        return QueueItem(
            analysis_id=analysis_id,
            priority=priority,
            status=QueueStatus.PENDING,
            created_at=datetime.now()
        )

    def _save_queue_item(self, queue_item: QueueItem) -> None:
        """Save queue item to database"""
        self.db.add(queue_item)
        self.db.commit()
        self.db.refresh(queue_item)

    def get_queue_items(
        self,
        status: Optional[QueueStatus] = None,
        priority: Optional[QueuePriority] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[QueueItem]:
        """Get queue items with optional filtering"""
        try:
            query = self.db.query(QueueItem)
            
            # Apply filters
            query = self._apply_queue_filters(query, status, priority)
            
            # Apply pagination
            query = query.order_by(QueueItem.created_at.desc())
            query = query.offset(offset).limit(limit)
            
            return query.all()
            
        except Exception as e:
            logger.error(f"Error getting queue items: {str(e)}")
            return []

    def _apply_queue_filters(self, query, status: Optional[QueueStatus], 
                           priority: Optional[QueuePriority]):
        """Apply filters to queue query"""
        if status:
            query = query.filter(QueueItem.status == status)
        if priority:
            query = query.filter(QueueItem.priority == priority)
        return query

    def get_queue_status(self) -> Dict[str, Any]:
        """Get queue status and statistics"""
        try:
            total_items = self.db.query(QueueItem).count()
            pending_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PENDING
            ).count()
            processing_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PROCESSING
            ).count()
            completed_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.COMPLETED
            ).count()
            failed_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.FAILED
            ).count()
            paused_items = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PAUSED
            ).count()

            return {
                "total_items": total_items,
                "pending_items": pending_items,
                "processing_items": processing_items,
                "completed_items": completed_items,
                "failed_items": failed_items,
                "paused_items": paused_items,
                "is_processing": self.is_processing
            }
            
        except Exception as e:
            logger.error(f"Error getting queue status: {str(e)}")
            return {
                "total_items": 0,
                "pending_items": 0,
                "processing_items": 0,
                "completed_items": 0,
                "failed_items": 0,
                "paused_items": 0,
                "is_processing": False
            }

    def pause_queue(self) -> bool:
        """Pause queue processing"""
        try:
            # Update all pending items to paused
            self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PENDING
            ).update({QueueItem.status: QueueStatus.PAUSED})
            
            # Update processing items to paused
            self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PROCESSING
            ).update({QueueItem.status: QueueStatus.PAUSED})
            
            self.db.commit()
            logger.info("Queue paused")
            return True
            
        except Exception as e:
            logger.error(f"Error pausing queue: {str(e)}")
            return False

    def resume_queue(self) -> bool:
        """Resume queue processing"""
        try:
            # Update all paused items back to pending
            self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.PAUSED
            ).update({QueueItem.status: QueueStatus.PENDING})
            
            self.db.commit()
            logger.info("Queue resumed")
            return True
            
        except Exception as e:
            logger.error(f"Error resuming queue: {str(e)}")
            return False

    async def start_processing(self):
        """Start queue processing"""
        if self.is_processing:
            logger.warning("Queue processing already started")
            return
        
        self.is_processing = True
        logger.info("Traitement de queue démarré")
        
        # Start processing in background
        self.processing_task = asyncio.create_task(self._process_queue())

    def stop_processing(self):
        """Stop queue processing"""
        self.is_processing = False
        if self.processing_task:
            self.processing_task.cancel()
        logger.info("Traitement de queue arrêté")

    async def _process_queue(self):
        """Main queue processing loop"""
        while self.is_processing:
            try:
                # Get pending items
                pending_items = self.get_queue_items(status=QueueStatus.PENDING, limit=5)
                
                if not pending_items:
                    await asyncio.sleep(1)
                    continue
                
                # Process items concurrently
                tasks = []
                for item in pending_items:
                    task = asyncio.create_task(self._start_processing_item(item))
                    tasks.append(task)
                
                # Wait for all tasks to complete
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
                
                # Cleanup completed tasks
                self._cleanup_completed_tasks()
                
            except Exception as e:
                logger.error(f"Error in queue processing: {str(e)}")
                await asyncio.sleep(5)

    def _calculate_available_slots(self) -> int:
        """Calculate available processing slots"""
        return 3  # Limit concurrent processing

    async def _start_processing_item(self, item: QueueItem) -> None:
        """Start processing a queue item"""
        try:
            # Mark as processing
            item.status = QueueStatus.PROCESSING
            item.started_at = datetime.now()
            self.db.commit()
            
            # Process the item
            await self._process_item(item)
            
        except Exception as e:
            logger.error(f"Error processing item {item.id}: {str(e)}")
            await self._handle_processing_error(item, None, str(e))

    def _cleanup_completed_tasks(self) -> None:
        """Clean up completed tasks"""
        try:
            # Remove completed items older than 1 hour
            cutoff_time = datetime.now()
            cutoff_time = cutoff_time.replace(hour=cutoff_time.hour - 1)
            
            deleted_count = self.db.query(QueueItem).filter(
                QueueItem.status == QueueStatus.COMPLETED,
                QueueItem.completed_at < cutoff_time
            ).delete()
            
            if deleted_count > 0:
                self.db.commit()
                logger.info(f"Cleaned up {deleted_count} completed queue items")
                
        except Exception as e:
            logger.error(f"Error cleaning up completed tasks: {str(e)}")

    async def _process_item(self, queue_item: QueueItem):
        """Process a single queue item"""
        try:
            # Get analysis and file
            analysis, file = self._get_analysis_and_file(queue_item.analysis_id)
            
            # Mark analysis as started
            self._mark_analysis_started(analysis)
            
            # Extract text if needed (including OCR)
            await self._extract_text_if_needed(file, queue_item)
            
            # Analyze with AI
            await self._analyze_with_ai(analysis, file, queue_item)
            
            # Mark as completed
            self._mark_item_completed(queue_item, analysis)
            
        except Exception as e:
            logger.error(f"Error processing item {queue_item.id}: {str(e)}")
            await self._handle_processing_error(queue_item, None, str(e))

    def _get_analysis_and_file(self, analysis_id: int) -> tuple[Analysis, File]:
        """Get analysis and associated file"""
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis {analysis_id} not found")
        
        file = self.db.query(File).filter(File.id == analysis.file_id).first()
        if not file:
            raise ValueError(f"File {analysis.file_id} not found")
        
        return analysis, file
    
    def _mark_analysis_started(self, analysis: Analysis) -> None:
        """Mark analysis as started"""
        analysis.started_at = datetime.now()
        self.db.commit()
    
    async def _extract_text_if_needed(self, file: File, queue_item: QueueItem) -> None:
        """Extract text from file if not already extracted (including OCR)"""
        if not file.extracted_text:
            self._update_progress(queue_item, 0.33, "Extraction de texte (OCR si nécessaire)")
            
            try:
                # Utiliser le service OCR pour extraire le texte
                extracted_text = await self.ocr_service.extract_text_from_file(file.id)
                
                if extracted_text:
                    file.extracted_text = extracted_text
                    file.status = "completed"
                    self.db.commit()
                    logger.info(f"Extracted text from file {file.id}: {len(extracted_text)} characters")
                else:
                    file.status = "failed"
                    file.error_message = "Aucun texte extrait"
                    self.db.commit()
                    raise Exception("Aucun texte extrait du fichier")
                    
            except Exception as e:
                logger.error(f"Error extracting text from file {file.id}: {str(e)}")
                file.status = "failed"
                file.error_message = str(e)
                self.db.commit()
                raise
    
    async def _analyze_with_ai(self, analysis: Analysis, file: File, queue_item: QueueItem) -> None:
        """Analyze file content with AI with real-time progress updates"""
        if file.extracted_text:
            # Mise à jour initiale
            self._update_progress(queue_item, 0.66, "Analyse IA en cours...")
            
            try:
                # Analyse avec IA
                result = await self.ai_service.analyze_text(
                    text=file.extracted_text,
                    analysis_type=analysis.analysis_type,
                    provider=analysis.provider,
                    model=analysis.model
                )
                
                # Mise à jour du résultat
                self._update_progress(queue_item, 0.95, "Finalisation...")
                self._update_analysis_result(analysis, result)
                
            except Exception as e:
                logger.error(f"Error during AI analysis: {str(e)}")
                raise
    
    def _update_progress(self, queue_item: QueueItem, progress: float, step: str) -> None:
        """Update queue item progress"""
        queue_item.progress = progress
        queue_item.current_step = step
        self.db.commit()
    
    def _update_analysis_result(self, analysis: Analysis, result: Dict[str, Any]) -> None:
        """Update analysis with AI result"""
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
        self.db.commit()
    
    def _mark_item_completed(self, queue_item: QueueItem, analysis: Analysis) -> None:
        """Mark queue item as completed"""
        queue_item.status = QueueStatus.COMPLETED
        queue_item.progress = 1.0
        queue_item.current_step = "Completed"
        queue_item.completed_at = datetime.now()
        self.db.commit()
        
        logger.info(f"Completed processing queue item {queue_item.id}")
    
    async def _handle_processing_error(self, queue_item: QueueItem, analysis: Analysis, error: str) -> None:
        """Handle processing error"""
        queue_item.status = QueueStatus.FAILED
        queue_item.error_message = error
        queue_item.completed_at = datetime.now()
        
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = error
        
        self.db.commit()
        
        logger.error(f"Failed processing queue item {queue_item.id}: {error}")

    def clear_queue(self, status: Optional[QueueStatus] = None):
        """Clear queue items by status"""
        try:
            query = self.db.query(QueueItem)
            if status:
                query = query.filter(QueueItem.status == status)
            
            deleted_count = query.delete()
            self.db.commit()
            
            logger.info(f"Cleared {deleted_count} queue items")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error clearing queue: {str(e)}")
            return 0

    def retry_failed_items(self, item_ids: Optional[List[int]] = None):
        """Retry failed queue items"""
        try:
            query = self.db.query(QueueItem).filter(QueueItem.status == QueueStatus.FAILED)
            
            if item_ids:
                query = query.filter(QueueItem.id.in_(item_ids))
            
            failed_items = query.all()
            
            for item in failed_items:
                item.status = QueueStatus.PENDING
                item.error_message = None
                item.progress = 0.0
                item.current_step = None
                item.started_at = None
                item.completed_at = None
            
            self.db.commit()
            
            logger.info(f"Retried {len(failed_items)} failed queue items")
            return len(failed_items)
            
        except Exception as e:
            logger.error(f"Error retrying failed items: {str(e)}")
            return 0

    def delete_queue_item(self, item_id: int) -> bool:
        """Delete a specific queue item"""
        try:
            item = self.db.query(QueueItem).filter(QueueItem.id == item_id).first()
            if not item:
                return False
            
            self.db.delete(item)
            self.db.commit()
            
            logger.info(f"Deleted queue item {item_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting queue item {item_id}: {str(e)}")
            return False

    def get_queue_item_details(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a queue item"""
        try:
            item = self.db.query(QueueItem).filter(QueueItem.id == item_id).first()
            if not item:
                return None
            
            analysis = self.db.query(Analysis).filter(Analysis.id == item.analysis_id).first()
            file = None
            if analysis:
                file = self.db.query(File).filter(File.id == analysis.file_id).first()
            
            return {
                "id": item.id,
                "status": item.status.value,
                "priority": item.priority.value,
                "progress": item.progress,
                "current_step": item.current_step,
                "error_message": item.error_message,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "started_at": item.started_at.isoformat() if item.started_at else None,
                "completed_at": item.completed_at.isoformat() if item.completed_at else None,
                "analysis": {
                    "id": analysis.id if analysis else None,
                    "type": analysis.analysis_type.value if analysis else None,
                    "provider": analysis.provider if analysis else None,
                    "model": analysis.model if analysis else None,
                    "status": analysis.status.value if analysis else None
                } if analysis else None,
                "file": {
                    "id": file.id if file else None,
                    "name": file.name if file else None,
                    "path": file.path if file else None,
                    "mime_type": file.mime_type if file else None,
                    "size": file.size if file else None
                } if file else None
            }
            
        except Exception as e:
            logger.error(f"Error getting queue item details {item_id}: {str(e)}")
            return None
