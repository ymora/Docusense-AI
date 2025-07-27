"""
Analysis service for DocuSense AI
Handles analysis creation, management, and results
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import logging

from ..models.analysis import Analysis, AnalysisStatus, AnalysisType, AnalysisUpdate
from ..models.file import File, FileStatus
from ..models.queue import QueueItem, QueuePriority
from .ai_service import AIService
from .queue_service import QueueService
from .prompt_service import PromptService

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analysis management"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService(db)
        self.queue_service = QueueService(db)
        self.prompt_service = PromptService()

    def create_analysis(
        self,
        file_id: int,
        analysis_type: AnalysisType,
        provider: str,
        model: str,
        custom_prompt: Optional[str] = None,
        add_to_queue: bool = True
    ) -> Analysis:
        """
        Create a new analysis
        """
        try:
            # Check if file exists
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file:
                raise ValueError(f"File {file_id} not found")

            # Generate prompt
            if custom_prompt:
                prompt = custom_prompt
            else:
                prompt = self.prompt_service.get_default_prompt(
                    analysis_type.value)
                if not prompt:
                    # Fallback to general prompt if specific one not found
                    prompt = self.prompt_service.get_default_prompt("GENERAL")

            # Create analysis
            analysis = Analysis(
                file_id=file_id,
                analysis_type=analysis_type,
                provider=provider,
                model=model,
                prompt=prompt,
                status=AnalysisStatus.PENDING
            )

            self.db.add(analysis)
            self.db.commit()
            self.db.refresh(analysis)

            # Update file status
            file.status = FileStatus.PROCESSING
            self.db.commit()

            # Add to queue if requested
            if add_to_queue:
                self.queue_service.add_to_queue(analysis.id)

            logger.info(f"Created analysis {analysis.id} for file {file_id}")
            return analysis

        except Exception as e:
            logger.error(f"Error creating analysis: {str(e)}")
            self.db.rollback()
            raise

    def get_analysis(self, analysis_id: int) -> Optional[Analysis]:
        """Get analysis by ID"""
        return self.db.query(Analysis).filter(
            Analysis.id == analysis_id).first()

    def get_analyses(
        self,
        file_id: Optional[int] = None,
        status: Optional[AnalysisStatus] = None,
        analysis_type: Optional[AnalysisType] = None,
        provider: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Analysis]:
        """
        Get analyses with filtering
        """
        query = self.db.query(Analysis)

        if file_id:
            query = query.filter(Analysis.file_id == file_id)

        if status:
            query = query.filter(Analysis.status == status)

        if analysis_type:
            query = query.filter(Analysis.analysis_type == analysis_type)

        if provider:
            query = query.filter(Analysis.provider == provider)

        return query.order_by(desc(Analysis.created_at)).offset(
            offset).limit(limit).all()

    def update_analysis(
        self,
        analysis_id: int,
        update_data: AnalysisUpdate
    ) -> Optional[Analysis]:
        """
        Update analysis
        """
        try:
            analysis = self.db.query(Analysis).filter(
                Analysis.id == analysis_id).first()
            if not analysis:
                return None

            # Update fields
            for field, value in update_data.dict(exclude_unset=True).items():
                setattr(analysis, field, value)

            self.db.commit()
            self.db.refresh(analysis)

            logger.info(f"Updated analysis {analysis_id}")
            return analysis

        except Exception as e:
            logger.error(f"Error updating analysis: {str(e)}")
            self.db.rollback()
            raise

    def delete_analysis(self, analysis_id: int) -> bool:
        """
        Delete analysis
        """
        try:
            analysis = self.db.query(Analysis).filter(
                Analysis.id == analysis_id).first()
            if not analysis:
                return False

            # Remove from queue if exists
            queue_item = self.db.query(QueueItem).filter(
                QueueItem.analysis_id == analysis_id
            ).first()
            if queue_item:
                self.db.delete(queue_item)

            # Delete analysis
            self.db.delete(analysis)
            self.db.commit()

            logger.info(f"Deleted analysis {analysis_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting analysis: {str(e)}")
            self.db.rollback()
            raise

    def create_bulk_analyses(
        self,
        file_ids: List[int],
        analysis_type: AnalysisType,
        provider: str,
        model: str,
        custom_prompt: Optional[str] = None,
        priority: QueuePriority = QueuePriority.NORMAL
    ) -> List[Analysis]:
        """
        Create multiple analyses for multiple files
        """
        try:
            analyses = []

            for file_id in file_ids:
                analysis = self.create_analysis(
                    file_id=file_id,
                    analysis_type=analysis_type,
                    provider=provider,
                    model=model,
                    custom_prompt=custom_prompt,
                    add_to_queue=False  # We'll add to queue manually with priority
                )
                analyses.append(analysis)

            # Add all to queue with specified priority
            for analysis in analyses:
                self.queue_service.add_to_queue(analysis.id, priority)

            logger.info(f"Created {len(analyses)} bulk analyses")
            return analyses

        except Exception as e:
            logger.error(f"Error creating bulk analyses: {str(e)}")
            self.db.rollback()
            raise

    def get_analysis_stats(self) -> Dict[str, Any]:
        """
        Get analysis statistics
        """
        try:
            total_analyses = self.db.query(Analysis).count()

            # Status counts
            status_counts = {}
            for status in AnalysisStatus:
                count = self.db.query(Analysis).filter(
                    Analysis.status == status).count()
                status_counts[status.value] = count

            # Type counts
            type_counts = {}
            for analysis_type in AnalysisType:
                count = self.db.query(Analysis).filter(
                    Analysis.analysis_type == analysis_type
                ).count()
                type_counts[analysis_type.value] = count

            # Provider counts
            provider_counts = {}
            providers = self.db.query(
                Analysis.provider, func.count(
                    Analysis.id)).group_by(
                Analysis.provider).all()
            for provider, count in providers:
                provider_counts[provider] = count

            # Recent activity
            recent_analyses = self.db.query(Analysis).order_by(
                desc(Analysis.created_at)
            ).limit(10).all()

            return {
                "total_analyses": total_analyses,
                "status_counts": status_counts,
                "type_counts": type_counts,
                "provider_counts": provider_counts,
                "recent_analyses": recent_analyses
            }

        except Exception as e:
            logger.error(f"Error getting analysis stats: {str(e)}")
            raise

    def retry_failed_analysis(self, analysis_id: int) -> Optional[Analysis]:
        """
        Retry a failed analysis
        """
        try:
            analysis = self.db.query(Analysis).filter(
                Analysis.id == analysis_id).first()
            if not analysis:
                return None

            if analysis.status != AnalysisStatus.FAILED:
                raise ValueError("Analysis is not in failed status")

            # Reset analysis status
            analysis.status = AnalysisStatus.PENDING
            analysis.error_message = None
            analysis.retry_count += 1

            # Update file status
            file = self.db.query(File).filter(
                File.id == analysis.file_id).first()
            if file:
                file.status = FileStatus.PROCESSING
                file.error_message = None

            self.db.commit()

            # Add to queue
            self.queue_service.add_to_queue(analysis.id)

            logger.info(f"Retried failed analysis {analysis_id}")
            return analysis

        except Exception as e:
            logger.error(f"Error retrying analysis: {str(e)}")
            self.db.rollback()
            raise

    def cancel_analysis(self, analysis_id: int) -> Optional[Analysis]:
        """
        Cancel an analysis
        """
        try:
            analysis = self.db.query(Analysis).filter(
                Analysis.id == analysis_id).first()
            if not analysis:
                return None

            # Update analysis status
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = "Analysis cancelled by user"

            # Update file status if it was processing
            file = self.db.query(File).filter(
                File.id == analysis.file_id).first()
            if file and file.status == FileStatus.PROCESSING:
                file.status = FileStatus.PENDING

            # Remove from queue if exists
            queue_item = self.db.query(QueueItem).filter(
                QueueItem.analysis_id == analysis_id
            ).first()
            if queue_item:
                queue_item.status = QueueStatus.FAILED
                queue_item.error_message = "Analysis cancelled by user"

            self.db.commit()

            logger.info(f"Cancelled analysis {analysis_id}")
            return analysis

        except Exception as e:
            logger.error(f"Error cancelling analysis: {str(e)}")
            self.db.rollback()
            raise

    async def analyze_text(
        self,
        text: str,
        analysis_type: AnalysisType,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze text using AI service
        """
        try:
            # Use AI service to analyze text
            result = await self.ai_service.analyze_text(
                text=text,
                analysis_type=analysis_type,
                provider=provider,
                model=model,
                custom_prompt=custom_prompt
            )

            return result

        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
            raise

    def create_analysis_with_prompt(
        self,
        file_id: int,
        analysis_type: AnalysisType,
        prompt_id: str,
        custom_prompt: str,
        status: AnalysisStatus = AnalysisStatus.PENDING
    ) -> Analysis:
        """
        Create analysis with specific prompt
        """
        try:
            # Check if file exists
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file:
                raise ValueError(f"File {file_id} not found")

            # Create analysis
            analysis = Analysis(
                file_id=file_id,
                analysis_type=analysis_type,
                provider="",  # Will be determined by AI service
                model="",     # Will be determined by AI service
                prompt=custom_prompt,
                status=status
            )

            self.db.add(analysis)
            self.db.commit()
            self.db.refresh(analysis)

            logger.info(
                f"Created analysis {
                    analysis.id} for file {file_id} with prompt {prompt_id}")
            return analysis

        except Exception as e:
            logger.error(f"Error creating analysis with prompt: {str(e)}")
            self.db.rollback()
            raise

    def update_analysis_result(
        self,
        analysis_id: int,
        result: Dict[str, Any],
        status: AnalysisStatus = AnalysisStatus.COMPLETED
    ) -> Optional[Analysis]:
        """
        Update analysis with result
        """
        try:
            analysis = self.get_analysis(analysis_id)
            if not analysis:
                return None

            # Update analysis
            analysis.result = result
            analysis.status = status
            analysis.completed_at = func.now()

            self.db.commit()
            self.db.refresh(analysis)

            # Update file status if analysis completed
            if status == AnalysisStatus.COMPLETED:
                file = self.db.query(File).filter(
                    File.id == analysis.file_id).first()
                if file:
                    file.status = FileStatus.COMPLETED
                    self.db.commit()

            logger.info(f"Updated analysis {analysis_id} with result")
            return analysis

        except Exception as e:
            logger.error(f"Error updating analysis result: {str(e)}")
            self.db.rollback()
            return None
