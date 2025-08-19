"""
Queue service for DocuSense AI
Handles analysis queue management and processing
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from ..core.database import get_db
from ..models.queue import QueueItem, QueueStatus, QueuePriority
from ..models.analysis import Analysis, AnalysisStatus, AnalysisType
from ..models.file import File, FileStatus
from .ai_service import get_ai_service
from .ocr_service import OCRService
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, QueueData


class QueueService(BaseService):
    """Service for managing analysis queue"""

    def __init__(self, db: Session):
        super().__init__(db)
        self.ai_service = get_ai_service(db)
        self.ocr_service = OCRService(db)
        self.is_processing = False
        self.processing_task = None

    @log_service_operation("add_to_queue")
    def add_to_queue(
        self,
        analysis_id: int,
        priority: QueuePriority = QueuePriority.NORMAL
    ) -> QueueItem:
        """Add analysis to queue"""
        return self.safe_execute("add_to_queue", self._add_to_queue_logic, analysis_id, priority)

    def _add_to_queue_logic(self, analysis_id: int, priority: QueuePriority) -> QueueItem:
        """Logic for adding to queue"""
        # Validate analysis exists
        self._validate_analysis_exists(analysis_id)
        
        # Check for duplicate
        self._check_duplicate_queue_item(analysis_id)
        
        # Create queue item
        queue_item = self._create_queue_item(analysis_id, priority)
        
        # Save to database
        self._save_queue_item(queue_item)
        
        self.logger.info(f"Added analysis {analysis_id} to queue with priority {priority}")
        return queue_item

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

    @log_service_operation("get_queue_items")
    def get_queue_items(
        self,
        status: Optional[QueueStatus] = None,
        priority: Optional[QueuePriority] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[QueueItem]:
        """Get queue items with optional filtering"""
        return self.safe_execute("get_queue_items", self._get_queue_items_logic, status, priority, limit, offset)

    def _get_queue_items_logic(self, status: Optional[QueueStatus], priority: Optional[QueuePriority], limit: int, offset: int) -> List[QueueItem]:
        """Logic for getting queue items"""
        query = self.db.query(QueueItem)
        
        # Apply filters
        query = self._apply_queue_filters(query, status, priority)
        
        # Join with analysis (left join to include analyses without files)
        query = query.outerjoin(QueueItem.analysis)
        
        # Apply pagination
        query = query.order_by(QueueItem.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        return query.all()

    def _apply_queue_filters(self, query, status: Optional[QueueStatus], 
                           priority: Optional[QueuePriority]):
        """Apply filters to queue query"""
        if status:
            query = query.filter(QueueItem.status == status)
        if priority:
            query = query.filter(QueueItem.priority == priority)
        return query



    @log_service_operation("pause_queue")
    def pause_queue(self) -> bool:
        """Pause queue processing"""
        return self.safe_execute("pause_queue", self._pause_queue_logic)

    def _pause_queue_logic(self) -> bool:
        """Logic for pausing queue"""
        # Update all pending items to paused
        self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.PENDING
        ).update({QueueItem.status: QueueStatus.PAUSED})
        
        # Update processing items to paused
        self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.PROCESSING
        ).update({QueueItem.status: QueueStatus.PAUSED})
        
        self.db.commit()
        self.logger.info("Queue paused")
        return True

    @log_service_operation("resume_queue")
    def resume_queue(self) -> bool:
        """Resume queue processing"""
        return self.safe_execute("resume_queue", self._resume_queue_logic)

    def _resume_queue_logic(self) -> bool:
        """Logic for resuming queue"""
        # Update all paused items back to pending
        self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.PAUSED
        ).update({QueueItem.status: QueueStatus.PENDING})
        
        self.db.commit()
        self.logger.info("Queue resumed")
        return True

    @log_service_operation("start_processing")
    async def start_processing(self):
        """Start queue processing"""
        if self.is_processing:
            self.logger.warning("Queue processing already started")
            return
        
        self.is_processing = True
        self.logger.info("Traitement de queue démarré")
        
        # Start processing in background
        self.processing_task = asyncio.create_task(self._process_queue())

    @log_service_operation("stop_processing")
    def stop_processing(self):
        """Stop queue processing"""
        self.is_processing = False
        if self.processing_task:
            self.processing_task.cancel()
        self.logger.info("Traitement de queue arrêté")

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
                self.logger.error(f"Error in queue processing: {str(e)}")
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
            self.logger.error(f"Error processing item {item.id}: {str(e)}")
            await self._handle_processing_error(item, None, str(e))

    @log_service_operation("cleanup_completed_tasks")
    def _cleanup_completed_tasks(self) -> None:
        """Clean up completed tasks"""
        self.safe_execute("cleanup_completed_tasks", self._cleanup_completed_tasks_logic)

    def _cleanup_completed_tasks_logic(self) -> None:
        """Logic for cleaning up completed tasks"""
        # Remove completed items older than 1 hour
        cutoff_time = datetime.now()
        cutoff_time = cutoff_time.replace(hour=cutoff_time.hour - 1)
        
        deleted_count = self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.COMPLETED,
            QueueItem.completed_at < cutoff_time
        ).delete()
        
        if deleted_count > 0:
            self.db.commit()
            self.logger.info(f"Cleaned up {deleted_count} completed queue items")

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
            self.logger.error(f"Error processing item {queue_item.id}: {str(e)}")
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
                    self.logger.info(f"Extracted text from file {file.id}: {len(extracted_text)} characters")
                else:
                    file.status = "failed"
                    file.error_message = "Aucun texte extrait"
                    self.db.commit()
                    raise Exception("Aucun texte extrait du fichier")
                    
            except Exception as e:
                self.logger.error(f"Error extracting text from file {file.id}: {str(e)}")
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
                self.logger.error(f"Error during AI analysis: {str(e)}")
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
        
        self.logger.info(f"Completed processing queue item {queue_item.id}")
    
    async def _handle_processing_error(self, queue_item: QueueItem, analysis: Analysis, error: str) -> None:
        """Handle processing error"""
        queue_item.status = QueueStatus.FAILED
        queue_item.error_message = error
        queue_item.completed_at = datetime.now()
        
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = error
        
        self.db.commit()
        
        self.logger.error(f"Failed processing queue item {queue_item.id}: {error}")

    @log_service_operation("clear_queue")
    def clear_queue(self, status: Optional[QueueStatus] = None):
        """Clear queue items by status"""
        return self.safe_execute("clear_queue", self._clear_queue_logic, status)

    def _clear_queue_logic(self, status: Optional[QueueStatus]) -> int:
        """Logic for clearing queue"""
        query = self.db.query(QueueItem)
        if status:
            query = query.filter(QueueItem.status == status)
        
        deleted_count = query.delete()
        self.db.commit()
        
        self.logger.info(f"Cleared {deleted_count} queue items")
        return deleted_count

    @log_service_operation("retry_failed_items")
    def retry_failed_items(self, item_ids: Optional[List[int]] = None):
        """Retry failed queue items"""
        return self.safe_execute("retry_failed_items", self._retry_failed_items_logic, item_ids)

    def _retry_failed_items_logic(self, item_ids: Optional[List[int]]) -> int:
        """Logic for retrying failed items"""
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
        
        self.logger.info(f"Retried {len(failed_items)} failed queue items")
        return len(failed_items)

    @log_service_operation("get_queue_status")
    def get_queue_status(self) -> Dict[str, Any]:
        """Get queue status and statistics"""
        return self.safe_execute("get_queue_status", self._get_queue_status_logic)

    def _get_queue_status_logic(self) -> Dict[str, Any]:
        """Logic for getting queue status"""
        # Get counts by status
        total_items = self.db.query(QueueItem).count()
        processing_items = self.db.query(QueueItem).filter(QueueItem.status == QueueStatus.PROCESSING).count()
        pending_items = self.db.query(QueueItem).filter(QueueItem.status == QueueStatus.PENDING).count()
        completed_items = self.db.query(QueueItem).filter(QueueItem.status == QueueStatus.COMPLETED).count()
        failed_items = self.db.query(QueueItem).filter(QueueItem.status == QueueStatus.FAILED).count()
        
        # Calculate average wait time for completed items
        completed_items_with_times = self.db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.COMPLETED,
            QueueItem.started_at.isnot(None),
            QueueItem.created_at.isnot(None)
        ).all()
        
        total_wait_time = 0
        for item in completed_items_with_times:
            if item.started_at and item.created_at:
                wait_time = (item.started_at - item.created_at).total_seconds()
                total_wait_time += wait_time
        
        average_wait_time = total_wait_time / len(completed_items_with_times) if completed_items_with_times else None
        
        return {
            "total_items": total_items,
            "processing_items": processing_items,
            "pending_items": pending_items,
            "completed_items": completed_items,
            "failed_items": failed_items,
            "average_wait_time": average_wait_time
        }

    @log_service_operation("delete_queue_item")
    def delete_queue_item(self, item_id: int) -> bool:
        """Delete a specific queue item"""
        return self.safe_execute("delete_queue_item", self._delete_queue_item_logic, item_id)

    def _delete_queue_item_logic(self, item_id: int) -> bool:
        """Logic for deleting queue item"""
        item = self.db.query(QueueItem).filter(QueueItem.id == item_id).first()
        if not item:
            return False
        
        # Supprimer l'analyse associée si elle existe
        if item.analysis_id:
            analysis = self.db.query(Analysis).filter(Analysis.id == item.analysis_id).first()
            if analysis:
                self.db.delete(analysis)
                self.logger.info(f"Deleted associated analysis {item.analysis_id}")
        
        # Supprimer l'élément de queue
        self.db.delete(item)
        self.db.commit()
        
        self.logger.info(f"Deleted queue item {item_id}")
        return True

    @log_service_operation("get_queue_item_details")
    def get_queue_item_details(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a queue item"""
        return self.safe_execute("get_queue_item_details", self._get_queue_item_details_logic, item_id)

    def _get_queue_item_details_logic(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Logic for getting queue item details"""
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

    @log_service_operation("update_analysis_provider_and_prompt")
    def update_analysis_provider_and_prompt(self, item_id: int, provider: str, prompt: str) -> bool:
        """Update provider and prompt for an analysis in queue"""
        return self.safe_execute("update_analysis_provider_and_prompt", self._update_analysis_provider_and_prompt_logic, item_id, provider, prompt)

    def _update_analysis_provider_and_prompt_logic(self, item_id: int, provider: str, prompt: str) -> bool:
        """Logic for updating analysis provider and prompt"""
        # Trouver l'élément de queue
        queue_item = self.db.query(QueueItem).filter(QueueItem.id == item_id).first()
        if not queue_item:
            self.logger.warning(f"Queue item {item_id} not found")
            return False
        
        # Vérifier que l'élément est en attente (modifiable)
        if queue_item.status != QueueStatus.PENDING:
            self.logger.warning(f"Queue item {item_id} is not pending (status: {queue_item.status})")
            return False
        
        # Trouver l'analyse associée
        analysis = self.db.query(Analysis).filter(Analysis.id == queue_item.analysis_id).first()
        if not analysis:
            self.logger.warning(f"Analysis {queue_item.analysis_id} not found for queue item {item_id}")
            return False
        
        # Mettre à jour le fournisseur et le prompt
        analysis.provider = provider
        analysis.prompt = prompt
        
        # Mettre à jour les métadonnées si nécessaire
        if not analysis.analysis_metadata:
            analysis.analysis_metadata = {}
        analysis.analysis_metadata.update({
            "updated_provider": provider,
            "updated_prompt": prompt,
            "updated_at": datetime.now().isoformat()
        })
        
        self.db.commit()
        
        self.logger.info(f"Updated analysis {analysis.id} provider to {provider} and prompt for queue item {item_id}")
        return True

    @log_service_operation("duplicate_analysis")
    def duplicate_analysis(self, item_id: int, new_provider: str = None, new_prompt: str = None) -> Optional[QueueItem]:
        """Duplicate an analysis with optional new provider and prompt"""
        return self.safe_execute("duplicate_analysis", self._duplicate_analysis_logic, item_id, new_provider, new_prompt)

    def _duplicate_analysis_logic(self, item_id: int, new_provider: str = None, new_prompt: str = None) -> Optional[QueueItem]:
        """Logic for duplicating an analysis"""
        # Trouver l'élément de queue original
        original_queue_item = self.db.query(QueueItem).filter(QueueItem.id == item_id).first()
        if not original_queue_item:
            self.logger.warning(f"Queue item {item_id} not found for duplication")
            return None
        
        # Trouver l'analyse originale
        original_analysis = self.db.query(Analysis).filter(Analysis.id == original_queue_item.analysis_id).first()
        if not original_analysis:
            self.logger.warning(f"Analysis {original_queue_item.analysis_id} not found for duplication")
            return None
        
        # Créer une nouvelle analyse basée sur l'originale
        new_analysis = Analysis(
            file_id=original_analysis.file_id,
            analysis_type=original_analysis.analysis_type,
            provider=new_provider if new_provider else original_analysis.provider,
            model=original_analysis.model,
            prompt=new_prompt if new_prompt else original_analysis.prompt,
            status=AnalysisStatus.PENDING,
            created_at=datetime.now(),
            analysis_metadata={
                "duplicated_from": original_analysis.id,
                "duplicated_at": datetime.now().isoformat(),
                "original_provider": original_analysis.provider,
                "original_prompt": original_analysis.prompt
            }
        )
        
        # Sauvegarder la nouvelle analyse
        self.db.add(new_analysis)
        self.db.commit()
        self.db.refresh(new_analysis)
        
        # Créer un nouvel élément de queue pour la nouvelle analyse
        new_queue_item = QueueItem(
            analysis_id=new_analysis.id,
            priority=QueuePriority.NORMAL,
            status=QueueStatus.PENDING,
            created_at=datetime.now()
        )
        
        # Sauvegarder le nouvel élément de queue
        self.db.add(new_queue_item)
        self.db.commit()
        self.db.refresh(new_queue_item)
        
        self.logger.info(f"Duplicated analysis {original_analysis.id} to {new_analysis.id} with queue item {new_queue_item.id}")
        return new_queue_item
