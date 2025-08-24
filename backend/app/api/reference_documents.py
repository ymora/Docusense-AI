"""
API pour les documents de référence
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any, Optional
import logging

from ..services.reference_document_service import ReferenceDocumentService
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reference-documents", tags=["reference-documents"])

@router.get("/")
@APIUtils.handle_errors
async def get_documents_summary() -> Dict[str, Any]:
    """Récupère un résumé de tous les documents de référence"""
    try:
        service = ReferenceDocumentService()
        summary = service.get_index_summary()
        return ResponseFormatter.success_response(
            data=summary,
            message="Résumé des documents de référence récupéré"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du résumé: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/categories")
@APIUtils.handle_errors
async def get_categories() -> Dict[str, Any]:
    """Récupère toutes les catégories de documents"""
    try:
        service = ReferenceDocumentService()
        categories = service.documents_index.get("categories", {})
        return ResponseFormatter.success_response(
            data=categories,
            message="Catégories récupérées"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des catégories: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/category/{category}")
@APIUtils.handle_errors
async def get_documents_by_category(
    category: str,
    subcategory: Optional[str] = Query(None, description="Sous-catégorie optionnelle")
) -> Dict[str, Any]:
    """Récupère les documents par catégorie"""
    try:
        service = ReferenceDocumentService()
        documents = service.get_documents_by_category(category, subcategory)
        return ResponseFormatter.success_response(
            data={
                "category": category,
                "subcategory": subcategory,
                "documents": documents,
                "count": len(documents)
            },
            message=f"Documents de la catégorie {category} récupérés"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des documents: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/search")
@APIUtils.handle_errors
async def search_documents(query: str = Query(..., description="Terme de recherche")) -> Dict[str, Any]:
    """Recherche dans les documents de référence"""
    try:
        service = ReferenceDocumentService()
        results = service.search_documents(query)
        return ResponseFormatter.success_response(
            data={
                "query": query,
                "results": results,
                "count": len(results)
            },
            message=f"Résultats de recherche pour '{query}'"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la recherche: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/document/{doc_id}")
@APIUtils.handle_errors
async def get_document(doc_id: str) -> Dict[str, Any]:
    """Récupère un document spécifique"""
    try:
        service = ReferenceDocumentService()
        document = service.get_document(doc_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document non trouvé")
        
        return ResponseFormatter.success_response(
            data=document,
            message="Document récupéré"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du document: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/document/{doc_id}/content")
@APIUtils.handle_errors
async def get_document_content(doc_id: str) -> Dict[str, Any]:
    """Récupère le contenu d'un document"""
    try:
        service = ReferenceDocumentService()
        content = service.get_document_content(doc_id)
        if content is None:
            raise HTTPException(status_code=404, detail="Document ou contenu non trouvé")
        
        return ResponseFormatter.success_response(
            data={
                "doc_id": doc_id,
                "content": content
            },
            message="Contenu du document récupéré"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du contenu: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/relevant/{analysis_type}")
@APIUtils.handle_errors
async def get_relevant_documents(
    analysis_type: str,
    keywords: Optional[str] = Query(None, description="Mots-clés séparés par des virgules")
) -> Dict[str, Any]:
    """Récupère les documents pertinents pour un type d'analyse"""
    try:
        service = ReferenceDocumentService()
        keyword_list = keywords.split(",") if keywords else None
        documents = service.get_relevant_documents_for_analysis(analysis_type, keyword_list)
        
        return ResponseFormatter.success_response(
            data={
                "analysis_type": analysis_type,
                "keywords": keyword_list,
                "documents": documents,
                "count": len(documents)
            },
            message=f"Documents pertinents pour {analysis_type} récupérés"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des documents pertinents: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.post("/add")
@APIUtils.handle_errors
async def add_document(
    file_path: str,
    category: str,
    subcategory: str,
    title: str,
    description: str,
    source_url: Optional[str] = None
) -> Dict[str, Any]:
    """Ajoute un nouveau document de référence"""
    try:
        service = ReferenceDocumentService()
        success = service.add_document(file_path, category, subcategory, title, description, source_url)
        
        if success:
            return ResponseFormatter.success_response(
                data={"file_path": file_path, "title": title},
                message="Document ajouté avec succès"
            )
        else:
            raise HTTPException(status_code=400, detail="Impossible d'ajouter le document")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'ajout du document: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")
