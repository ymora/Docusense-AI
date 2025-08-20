"""
Analysis service for DocuSense AI
Handles analysis creation, management, and processing
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy import func, desc

from ..core.database import get_db
from ..models.analysis import Analysis, AnalysisType, AnalysisStatus, AnalysisUpdate
from ..models.file import File, FileStatus
from .ai_service import get_ai_service
from .prompt_service import PromptService
from .pdf_generator_service import PDFGeneratorService
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, AnalysisData


class AnalysisService(BaseService):
    """Service for analysis management"""

    def __init__(self, db: Session):
        super().__init__(db)
        self.ai_service = get_ai_service(db)
        self.prompt_service = PromptService()
        self.pdf_generator = PDFGeneratorService(db)

    @log_service_operation("create_analysis")
    def create_analysis(
        self,
        file_id: int,
        analysis_type: AnalysisType,
        provider: str,
        model: str,
        custom_prompt: Optional[str] = None,
        start_processing: bool = True,
        user_id: int = None
    ) -> Analysis:
        """
        Create a new analysis
        """
        return self.safe_execute("create_analysis", self._create_analysis_logic, file_id, analysis_type, provider, model, custom_prompt, start_processing, user_id)

    def _create_analysis_logic(self, file_id: int, analysis_type: AnalysisType, provider: str, model: str, custom_prompt: Optional[str], start_processing: bool, user_id: int = None) -> Analysis:
        """Logic for creating analysis"""
        # Check if file exists
        file = self.db.query(File).filter(File.id == file_id).first()
        if not file:
            raise ValueError(f"File {file_id} not found")

        # Generate prompt
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = self.prompt_service.get_default_prompt(analysis_type.value)
            if not prompt:
                # Fallback to general prompt if specific one not found
                prompt = self.prompt_service.get_default_prompt("GENERAL")

        # Set initial status
        initial_status = AnalysisStatus.PROCESSING if start_processing else AnalysisStatus.PENDING

        # Create analysis
        analysis = Analysis(
            file_id=file_id,
            analysis_type=analysis_type,
            provider=provider,
            model=model,
            prompt=prompt,
            status=initial_status,
            progress=0.0,
            total_steps=1,
            user_id=user_id
        )

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        # Update file status
        file.status = FileStatus.PROCESSING
        self.db.commit()

        # Start processing if requested
        if start_processing:
            # Start processing in background
            self._start_processing(analysis.id)

        self.logger.info(f"Created analysis {analysis.id} for file {file_id}")
        return analysis

    def _start_processing(self, analysis_id: int) -> None:
        """Start processing an analysis"""
        try:
            # Update status to processing
            analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if analysis:
                analysis.status = AnalysisStatus.PROCESSING
                analysis.started_at = datetime.now()
                self.db.commit()
                
                # Start background processing
                self._process_analysis_async(analysis_id)
        except Exception as e:
            self.logger.error(f"Error starting processing for analysis {analysis_id}: {str(e)}")

    def _process_analysis_async(self, analysis_id: int) -> None:
        """Process analysis asynchronously"""
        # This would be implemented with a proper task queue (Celery, RQ, etc.)
        # For now, we'll just simulate processing
        import threading
        import time
        
        def process():
            try:
                time.sleep(2)  # Simulate processing time
                analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
                if analysis:
                    analysis.status = AnalysisStatus.COMPLETED
                    analysis.progress = 1.0
                    analysis.completed_at = datetime.now()
                    analysis.result = f"Analysis completed for file {analysis.file_id}"
                    self.db.commit()
            except Exception as e:
                self.logger.error(f"Error processing analysis {analysis_id}: {str(e)}")
                analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
                if analysis:
                    analysis.status = AnalysisStatus.FAILED
                    analysis.error_message = str(e)
                    self.db.commit()
        
        thread = threading.Thread(target=process)
        thread.daemon = True
        thread.start()

    @log_service_operation("get_analysis")
    def get_analysis(self, analysis_id: int) -> Optional[Analysis]:
        """Get analysis by ID"""
        return self.safe_execute("get_analysis", self._get_analysis_logic, analysis_id)

    def _get_analysis_logic(self, analysis_id: int) -> Optional[Analysis]:
        """Logic for getting analysis"""
        return self.db.query(Analysis).filter(Analysis.id == analysis_id).first()

    @log_service_operation("get_analyses")
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
        return self.safe_execute("get_analyses", self._get_analyses_logic, file_id, status, analysis_type, provider, limit, offset)

    def _get_analyses_logic(self, file_id: Optional[int], status: Optional[AnalysisStatus], analysis_type: Optional[AnalysisType], provider: Optional[str], limit: int, offset: int) -> List[Analysis]:
        """Logic for getting analyses"""
        query = self.db.query(Analysis)

        if file_id:
            query = query.filter(Analysis.file_id == file_id)

        if status:
            query = query.filter(Analysis.status == status)

        if analysis_type:
            query = query.filter(Analysis.analysis_type == analysis_type)

        if provider:
            query = query.filter(Analysis.provider == provider)

        return query.order_by(desc(Analysis.created_at)).offset(offset).limit(limit).all()

    @log_service_operation("update_analysis")
    def update_analysis(
        self,
        analysis_id: int,
        update_data: AnalysisUpdate
    ) -> Optional[Analysis]:
        """
        Update analysis
        """
        return self.safe_execute("update_analysis", self._update_analysis_logic, analysis_id, update_data)

    def _update_analysis_logic(self, analysis_id: int, update_data: AnalysisUpdate) -> Optional[Analysis]:
        """Logic for updating analysis"""
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return None

        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(analysis, field, value)

        self.db.commit()
        self.db.refresh(analysis)

        self.logger.info(f"Updated analysis {analysis_id}")
        return analysis

    @log_service_operation("delete_analysis")
    def delete_analysis(self, analysis_id: int) -> bool:
        """
        Delete analysis
        """
        return self.safe_execute("delete_analysis", self._delete_analysis_logic, analysis_id)

    def _delete_analysis_logic(self, analysis_id: int) -> bool:
        """Logic for deleting analysis"""
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return False

        # Delete analysis
        self.db.delete(analysis)
        self.db.commit()

        self.logger.info(f"Deleted analysis {analysis_id}")
        return True

    @log_service_operation("create_bulk_analyses")
    def create_bulk_analyses(
        self,
        file_ids: List[int],
        analysis_type: AnalysisType,
        provider: str,
        model: str,
        custom_prompt: Optional[str] = None,
        # Priorité supprimée - ordre chronologique uniquement
    ) -> List[Analysis]:
        """
        Create multiple analyses for multiple files
        """
        return self.safe_execute("create_bulk_analyses", self._create_bulk_analyses_logic, file_ids, analysis_type, provider, model, custom_prompt)

    def _create_bulk_analyses_logic(self, file_ids: List[int], analysis_type: AnalysisType, provider: str, model: str, custom_prompt: Optional[str]) -> List[Analysis]:
        """Logic for creating bulk analyses"""
        analyses = []

        for file_id in file_ids:
            analysis = self.create_analysis(
                file_id=file_id,
                analysis_type=analysis_type,
                provider=provider,
                model=model,
                custom_prompt=custom_prompt,
                start_processing=True
            )
            analyses.append(analysis)

        self.logger.info(f"Created {len(analyses)} bulk analyses")
        return analyses

    @log_service_operation("get_analysis_stats")
    def get_analysis_stats(self) -> Dict[str, Any]:
        """
        Get analysis statistics
        """
        return self.safe_execute("get_analysis_stats", self._get_analysis_stats_logic)

    def _get_analysis_stats_logic(self) -> Dict[str, Any]:
        """Logic for getting analysis stats"""
        total_analyses = self.db.query(Analysis).count()

        # Status counts
        status_counts = {}
        for status in AnalysisStatus:
            count = self.db.query(Analysis).filter(Analysis.status == status).count()
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
            Analysis.provider, func.count(Analysis.id)
        ).group_by(Analysis.provider).all()
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

    @log_service_operation("retry_failed_analysis")
    def retry_failed_analysis(self, analysis_id: int) -> Optional[Analysis]:
        """
        Retry a failed analysis
        """
        return self.safe_execute("retry_failed_analysis", self._retry_failed_analysis_logic, analysis_id)

    def _retry_failed_analysis_logic(self, analysis_id: int) -> Optional[Analysis]:
        """Logic for retrying failed analysis"""
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return None

        if analysis.status != AnalysisStatus.FAILED:
            raise ValueError("Analysis is not in failed status")

        # Reset analysis status
        analysis.status = AnalysisStatus.PENDING
        analysis.error_message = None
        analysis.retry_count += 1
        analysis.progress = 0.0
        analysis.current_step = None

        # Update file status
        file = self.db.query(File).filter(File.id == analysis.file_id).first()
        if file:
            file.status = FileStatus.PROCESSING
            file.error_message = None

        self.db.commit()

        # Start processing
        self._start_processing(analysis_id)

        self.logger.info(f"Retried failed analysis {analysis_id}")
        return analysis

    @log_service_operation("cancel_analysis")
    def cancel_analysis(self, analysis_id: int) -> Optional[Analysis]:
        """
        Cancel an analysis
        """
        return self.safe_execute("cancel_analysis", self._cancel_analysis_logic, analysis_id)

    def _cancel_analysis_logic(self, analysis_id: int) -> Optional[Analysis]:
        """Logic for cancelling analysis"""
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return None

        # Update analysis status
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = "Analysis cancelled by user"

        # Update file status if it was processing
        file = self.db.query(File).filter(File.id == analysis.file_id).first()
        if file and file.status == FileStatus.PROCESSING:
            file.status = FileStatus.PENDING

        self.db.commit()

        self.logger.info(f"Cancelled analysis {analysis_id}")
        return analysis

    @log_service_operation("analyze_text")
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
        return await self.safe_execute("analyze_text", self._analyze_text_logic, text, analysis_type, provider, model, custom_prompt)

    async def _analyze_text_logic(self, text: str, analysis_type: AnalysisType, provider: Optional[str], model: Optional[str], custom_prompt: Optional[str]) -> Dict[str, Any]:
        """Logic for analyzing text"""
        # Use AI service to analyze text
        result = await self.ai_service.analyze_text(
            text=text,
            analysis_type=analysis_type,
            provider=provider,
            model=model,
            custom_prompt=custom_prompt
        )

        return result

    @log_service_operation("create_analysis_with_prompt")
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
        return self.safe_execute("create_analysis_with_prompt", self._create_analysis_with_prompt_logic, file_id, analysis_type, prompt_id, custom_prompt, status)

    def _create_analysis_with_prompt_logic(self, file_id: int, analysis_type: AnalysisType, prompt_id: str, custom_prompt: str, status: AnalysisStatus) -> Analysis:
        """Logic for creating analysis with prompt"""
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

        self.logger.info(f"Created analysis {analysis.id} for file {file_id} with prompt {prompt_id}")
        return analysis

    @log_service_operation("update_analysis_result")
    def update_analysis_result(
        self,
        analysis_id: int,
        result: Dict[str, Any],
        status: AnalysisStatus = AnalysisStatus.COMPLETED
    ) -> Optional[Analysis]:
        """
        Update analysis with result
        """
        return self.safe_execute("update_analysis_result", self._update_analysis_result_logic, analysis_id, result, status)

    def _update_analysis_result_logic(self, analysis_id: int, result: Dict[str, Any], status: AnalysisStatus) -> Optional[Analysis]:
        """Logic for updating analysis result"""
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
            file = self.db.query(File).filter(File.id == analysis.file_id).first()
            if file:
                file.status = FileStatus.COMPLETED
                self.db.commit()
            
            # Generate PDF for completed analysis
            try:
                pdf_path = self.pdf_generator.generate_analysis_pdf(analysis_id)
                if pdf_path:
                    self.logger.info(f"Generated PDF for completed analysis {analysis_id}: {pdf_path}")
            except Exception as e:
                self.logger.error(f"Failed to generate PDF for analysis {analysis_id}: {str(e)}")

        self.logger.info(f"Updated analysis {analysis_id} with result")
        return analysis
