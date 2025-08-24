"""
Service de gestion des documents de référence pour DocuSense AI
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
import requests
from urllib.parse import urlparse
import hashlib
from datetime import datetime

class ReferenceDocumentService:
    """Service pour gérer les documents de référence"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.base_path = Path(__file__).parent.parent.parent.parent / "reference_documents"
        self.index_file = self.base_path / "global_index.json"
        self.documents_index = self._load_index()
        
    def _load_index(self) -> Dict[str, Any]:
        """Charge l'index des documents"""
        if self.index_file.exists():
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Erreur lors du chargement de l'index: {e}")
                return {"documents": {}, "categories": {}, "last_updated": None}
        return {"documents": {}, "categories": {}, "last_updated": None}
    
    def _save_index(self):
        """Sauvegarde l'index des documents"""
        try:
            self.index_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.index_file, 'w', encoding='utf-8') as f:
                json.dump(self.documents_index, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Erreur lors de la sauvegarde de l'index: {e}")
    
    def add_document(self, file_path: str, category: str, subcategory: str, 
                    title: str, description: str, source_url: str = None) -> bool:
        """Ajoute un document à l'index"""
        try:
            full_path = self.base_path / file_path
            if not full_path.exists():
                self.logger.error(f"Document non trouvé: {full_path}")
                return False
            
            # Calculer le hash du fichier
            file_hash = self._calculate_file_hash(full_path)
            
            # Créer l'entrée du document
            doc_id = f"{category}_{subcategory}_{hashlib.md5(title.encode()).hexdigest()[:8]}"
            
            document_info = {
                "id": doc_id,
                "title": title,
                "description": description,
                "file_path": file_path,
                "category": category,
                "subcategory": subcategory,
                "source_url": source_url,
                "file_hash": file_hash,
                "file_size": full_path.stat().st_size,
                "added_date": datetime.now().isoformat(),
                "last_accessed": None
            }
            
            # Ajouter à l'index
            self.documents_index["documents"][doc_id] = document_info
            
            # Mettre à jour les catégories
            if category not in self.documents_index["categories"]:
                self.documents_index["categories"][category] = {}
            if subcategory not in self.documents_index["categories"][category]:
                self.documents_index["categories"][category][subcategory] = []
            
            self.documents_index["categories"][category][subcategory].append(doc_id)
            self.documents_index["last_updated"] = datetime.now().isoformat()
            
            self._save_index()
            self.logger.info(f"Document ajouté: {title}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'ajout du document: {e}")
            return False
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calcule le hash MD5 d'un fichier"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un document par son ID"""
        if doc_id in self.documents_index["documents"]:
            doc = self.documents_index["documents"][doc_id].copy()
            # Mettre à jour la date d'accès
            doc["last_accessed"] = datetime.now().isoformat()
            self.documents_index["documents"][doc_id]["last_accessed"] = doc["last_accessed"]
            self._save_index()
            return doc
        return None
    
    def get_documents_by_category(self, category: str, subcategory: str = None) -> List[Dict[str, Any]]:
        """Récupère les documents par catégorie"""
        documents = []
        if category in self.documents_index["categories"]:
            if subcategory:
                if subcategory in self.documents_index["categories"][category]:
                    for doc_id in self.documents_index["categories"][category][subcategory]:
                        doc = self.get_document(doc_id)
                        if doc:
                            documents.append(doc)
            else:
                for subcat in self.documents_index["categories"][category]:
                    for doc_id in self.documents_index["categories"][category][subcat]:
                        doc = self.get_document(doc_id)
                        if doc:
                            documents.append(doc)
        return documents
    
    def search_documents(self, query: str) -> List[Dict[str, Any]]:
        """Recherche dans les documents"""
        results = []
        query_lower = query.lower()
        
        for doc_id, doc in self.documents_index["documents"].items():
            if (query_lower in doc["title"].lower() or 
                query_lower in doc["description"].lower()):
                results.append(doc)
        
        return results
    
    def get_document_content(self, doc_id: str) -> Optional[str]:
        """Récupère le contenu textuel d'un document"""
        doc = self.get_document(doc_id)
        if not doc:
            return None
        
        file_path = self.base_path / doc["file_path"]
        if not file_path.exists():
            return None
        
        try:
            # Pour l'instant, on lit le contenu brut
            # TODO: Ajouter la conversion PDF vers texte
            if file_path.suffix.lower() == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            elif file_path.suffix.lower() == '.json':
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return json.dumps(data, indent=2, ensure_ascii=False)
            else:
                # Pour les PDFs, on retourne un message d'info
                return f"Document PDF: {doc['title']} - Utilisez un service de conversion PDF pour extraire le texte"
                
        except Exception as e:
            self.logger.error(f"Erreur lors de la lecture du document {doc_id}: {e}")
            return None
    
    def get_relevant_documents_for_analysis(self, analysis_type: str, keywords: List[str] = None) -> List[Dict[str, Any]]:
        """Récupère les documents pertinents pour un type d'analyse"""
        relevant_docs = []
        
        # Mapping des types d'analyse vers les catégories
        analysis_mapping = {
            "JURIDICAL": ["juridique"],
            "TECHNICAL": ["construction"],
            "ADMINISTRATIVE": ["administratif"],
            "construction_litigation_analysis": ["juridique", "construction"],
            "technical_norm_verification": ["construction"],
            "technical_dtu_analysis": ["construction"],
            "construction_contract_analysis": ["juridique"],
            "administrative_document_analysis": ["administratif"]
        }
        
        categories = analysis_mapping.get(analysis_type, [])
        
        for category in categories:
            docs = self.get_documents_by_category(category)
            relevant_docs.extend(docs)
        
        # Filtrer par mots-clés si fournis
        if keywords:
            filtered_docs = []
            for doc in relevant_docs:
                doc_text = f"{doc['title']} {doc['description']}".lower()
                if any(keyword.lower() in doc_text for keyword in keywords):
                    filtered_docs.append(doc)
            relevant_docs = filtered_docs
        
        return relevant_docs
    
    def get_index_summary(self) -> Dict[str, Any]:
        """Récupère un résumé de l'index"""
        summary = {
            "total_documents": len(self.documents_index["documents"]),
            "categories": {},
            "last_updated": self.documents_index.get("last_updated")
        }
        
        for category, subcategories in self.documents_index["categories"].items():
            summary["categories"][category] = {
                "total": sum(len(docs) for docs in subcategories.values()),
                "subcategories": {subcat: len(docs) for subcat, docs in subcategories.items()}
            }
        
        return summary
