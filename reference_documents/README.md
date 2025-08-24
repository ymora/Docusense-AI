# 📚 Documents de Référence - DocuSense AI

## Vue d'ensemble

Ce répertoire contient les documents de référence qui servent de base de connaissances pour l'analyse IA de DocuSense AI. Ces documents permettent à l'IA d'effectuer des analyses précises et conformes aux normes françaises.

## 📁 Structure des dossiers

```
reference_documents/
├── construction/           # Documents techniques de construction
│   ├── dtu/               # Documents Techniques Unifiés
│   ├── normes/            # Normes françaises et européennes
│   └── reglementations/   # Réglementations (RE2020, RT2012, etc.)
├── juridique/             # Documents juridiques
│   ├── code_civil/        # Code Civil
│   ├── code_construction/ # Code de la Construction
│   └── jurisprudence/     # Jurisprudence
│       ├── construction/  # Jurisprudence construction
│       └── contrat/       # Jurisprudence contrats
├── administratif/         # Documents administratifs
│   ├── urbanisme/         # Code de l'Urbanisme
│   └── permis/            # Permis de construire
└── global_index.json      # Index global des documents
```

## 🏗️ Documents de Construction

### DTU (Documents Techniques Unifiés)
- **DTU 31.1** - Charpente en bois
- **DTU 40.1** - Plomberie sanitaire
- **DTU 51.1** - Isolation thermique

### Réglementations
- **RE2020** - Réglementation Environnementale
- **RT2012** - Réglementation Thermique

## ⚖️ Documents Juridiques

### Code Civil
- **Livre III** - Contrats (Articles 1101-1108)

### Code de la Construction
- **Responsabilité décennale** (Articles L111-1 à L111-7)
- **Garanties légales**

## 📄 Documents Administratifs

### Code de l'Urbanisme
- **Articles L111-1 à L111-5** - Principes généraux

## 🔧 Utilisation

### Via l'API

```bash
# Récupérer le résumé des documents
GET /api/reference-documents/

# Récupérer les catégories
GET /api/reference-documents/categories

# Récupérer les documents par catégorie
GET /api/reference-documents/category/{category}?subcategory={subcategory}

# Rechercher dans les documents
GET /api/reference-documents/search?query={query}

# Récupérer un document spécifique
GET /api/reference-documents/document/{doc_id}

# Récupérer le contenu d'un document
GET /api/reference-documents/document/{doc_id}/content

# Récupérer les documents pertinents pour une analyse
GET /api/reference-documents/relevant/{analysis_type}?keywords={keywords}
```

### Via le Frontend

```typescript
import { referenceDocumentService } from '../services/referenceDocumentService';

// Récupérer le résumé
const summary = await referenceDocumentService.getSummary();

// Rechercher des documents
const results = await referenceDocumentService.searchDocuments('DTU');

// Récupérer les documents pertinents pour une analyse
const relevant = await referenceDocumentService.getRelevantDocuments('TECHNICAL');
```

## 🚀 Ajout de nouveaux documents

### 1. Ajout manuel

1. Placez le fichier dans le bon répertoire selon sa catégorie
2. Utilisez l'API pour l'ajouter à l'index :

```bash
POST /api/reference-documents/add
{
  "file_path": "construction/dtu/nouveau_dtu.txt",
  "category": "construction",
  "subcategory": "dtu",
  "title": "Nouveau DTU",
  "description": "Description du nouveau DTU",
  "source_url": "https://source.com"
}
```

### 2. Ajout automatique

Utilisez le script de téléchargement :

```bash
python scripts/download_reference_documents.py
```

## 📊 Index des documents

L'index global (`global_index.json`) contient :

```json
{
  "documents": {
    "doc_id": {
      "id": "construction_dtu_abc12345",
      "title": "DTU 31.1 - Charpente en bois",
      "description": "Document Technique Unifié pour la charpente en bois",
      "file_path": "construction/dtu/DTU_31.1_Charpente_bois.txt",
      "category": "construction",
      "subcategory": "dtu",
      "source_url": "https://www.cstb.fr/",
      "file_hash": "md5_hash",
      "file_size": 1234,
      "added_date": "2025-01-07T10:00:00",
      "last_accessed": "2025-01-07T15:30:00"
    }
  },
  "categories": {
    "construction": {
      "dtu": ["doc_id1", "doc_id2"],
      "normes": ["doc_id3"],
      "reglementations": ["doc_id4"]
    }
  },
  "last_updated": "2025-01-07T10:00:00"
}
```

## 🔍 Intégration avec l'IA

Les documents de référence sont automatiquement intégrés dans les prompts d'analyse :

1. **Sélection automatique** : L'IA sélectionne les documents pertinents selon le type d'analyse
2. **Enrichissement des prompts** : Le contenu des documents est ajouté au prompt de base
3. **Références citées** : L'IA cite les articles et normes pertinents dans ses réponses

### Types d'analyse supportés

- **JURIDICAL** : Utilise les documents du Code Civil et Code de la Construction
- **TECHNICAL** : Utilise les DTU, normes et réglementations
- **ADMINISTRATIVE** : Utilise le Code de l'Urbanisme et documents administratifs
- **construction_litigation_analysis** : Utilise la jurisprudence construction
- **technical_norm_verification** : Utilise les DTU et normes techniques

## 🛠️ Maintenance

### Mise à jour de l'index

```bash
# Recharger l'index
python -c "
from backend.app.services.reference_document_service import ReferenceDocumentService
service = ReferenceDocumentService()
service._save_index()
"
```

### Vérification de l'intégrité

```bash
# Vérifier les fichiers manquants
python -c "
from backend.app.services.reference_document_service import ReferenceDocumentService
service = ReferenceDocumentService()
for doc_id, doc in service.documents_index['documents'].items():
    if not (service.base_path / doc['file_path']).exists():
        print(f'Fichier manquant: {doc['file_path']}')
"
```

## 📝 Sources des documents

- **DTU** : Centre Scientifique et Technique du Bâtiment (CSTB)
- **Code Civil** : Légifrance
- **Code de la Construction** : Légifrance
- **Réglementations** : Ministère de la Transition Écologique
- **Code de l'Urbanisme** : Légifrance

## ⚠️ Notes importantes

1. **Respect des droits d'auteur** : Seuls les documents publics et libres de droits sont inclus
2. **Mise à jour régulière** : Les documents doivent être mis à jour selon les évolutions législatives
3. **Validation** : Vérifiez toujours la conformité avec les sources officielles
4. **Performance** : L'index est optimisé pour des recherches rapides

## 🔗 Liens utiles

- [CSTB - DTU](https://www.cstb.fr/fr/produits-solutions/dtu/)
- [Légifrance](https://www.legifrance.gouv.fr/)
- [Ministère de la Transition Écologique](https://www.ecologie.gouv.fr/)
- [AFNOR](https://www.afnor.org/)
