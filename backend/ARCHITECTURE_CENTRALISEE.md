# Architecture Centralisée - DocuSense AI

## 🏗️ Vue d'ensemble

Cette architecture centralisée a été conçue pour éliminer les doublons, améliorer la maintenabilité et faciliter la réutilisation du code. Toutes les fonctions importantes sont maintenant organisées dans des modules spécialisés.

## 📁 Structure des modules

### `app/core/file_utils.py`
**Gestion centralisée des fichiers et formats**

#### Classes principales :
- **`FileFormatManager`** : Gestionnaire des formats supportés
  - `SUPPORTED_FORMATS` : Liste centralisée des formats
  - `FORMAT_CATEGORIES` : Catégorisation des formats
  - `is_format_supported()` : Vérification de support
  - `get_format_category()` : Obtention de la catégorie

- **`FileInfoExtractor`** : Extracteur d'informations de fichiers
  - `extract_file_info()` : Extraction pour fichiers supportés
  - `extract_unsupported_file_info()` : Extraction pour fichiers non supportés
  - `_get_mime_type()` : Détermination du type MIME

- **`DirectoryInfoExtractor`** : Extracteur d'informations de répertoires
  - `extract_directory_info()` : Extraction d'informations de répertoire

- **`FilePathUtils`** : Utilitaires de manipulation de chemins
  - `normalize_path()` : Normalisation de chemins
  - `is_subdirectory()` : Vérification de sous-répertoire
  - `get_relative_path()` : Obtention de chemin relatif

### `app/core/status_manager.py`
**Gestion centralisée des statuts de fichiers**

#### Classes principales :
- **`FileStatus`** : Enumération des statuts possibles
  - `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `UNSUPPORTED`

- **`StatusInfo`** : Informations sur un statut
  - `value`, `label`, `color`, `icon`, `description`, `can_analyze`, `can_retry`

- **`StatusManager`** : Gestionnaire des statuts
  - `STATUS_CONFIG` : Configuration centralisée des statuts
  - `get_status_info()` : Obtention d'informations de statut
  - `can_analyze_file()` : Vérification de possibilité d'analyse
  - `can_retry_file()` : Vérification de possibilité de retry

- **`StatusTransitionManager`** : Gestionnaire des transitions
  - `ALLOWED_TRANSITIONS` : Transitions autorisées
  - `can_transition_to()` : Vérification de transition
  - `validate_transition()` : Validation de transition

- **`StatusAnalyzer`** : Analyseur de statuts
  - `analyze_status_distribution()` : Analyse de distribution
  - `get_status_priority()` : Obtention de priorité d'affichage

### `app/core/database_utils.py`
**Utilitaires centralisés pour la base de données**

#### Classes principales :
- **`DatabaseUtils`** : Utilitaires de base de données
  - `safe_transaction()` : Gestionnaire de contexte pour transactions
  - `bulk_operation()` : Opérations en lot
  - `safe_query()` : Requêtes sécurisées

- **`QueryBuilder`** : Constructeur de requêtes
  - `build_file_filters()` : Construction de filtres
  - `build_pagination_query()` : Application de pagination

- **`DatabaseValidator`** : Validateur de base de données
  - `validate_file_exists()` : Validation d'existence de fichier
  - `validate_directory_exists()` : Validation d'existence de répertoire

- **`DatabaseMetrics`** : Métriques de base de données
  - `get_file_count_by_status()` : Comptage par statut
  - `get_total_file_count()` : Comptage total

### `app/core/validation.py`
**Validation et gestion d'erreurs centralisées**

#### Classes principales :
- **`ValidationError`** : Erreur de validation
  - `field`, `message`, `code`, `value`

- **`ValidationResult`** : Résultat de validation
  - `is_valid`, `errors`, `warnings`

- **`FileValidator`** : Validateur de fichiers
  - `MAX_FILE_SIZES` : Tailles maximales par format
  - `validate_file_path()` : Validation de chemin de fichier
  - `validate_directory_path()` : Validation de chemin de répertoire

- **`DataValidator`** : Validateur de données
  - `validate_required_fields()` : Validation de champs requis
  - `validate_string_length()` : Validation de longueur de chaîne
  - `validate_integer_range()` : Validation de plage d'entier

- **`ErrorHandler`** : Gestionnaire d'erreurs
  - `format_validation_errors()` : Formatage d'erreurs
  - `log_validation_result()` : Logging de résultats
  - `handle_exception()` : Gestion d'exceptions

## 🔄 Migration des services

### `FileService` refactorisé

**Avant :**
```python
def _get_file_info(self, file_path: Path) -> Optional[Dict[str, Any]]:
    # Logique complexe et dupliquée
    extension = file_path.suffix.lower().lstrip('.')
    if extension not in self.supported_formats:
        return None
    # ... plus de logique
```

**Après :**
```python
# Utilisation des modules centralisés
file_info = FileInfoExtractor.extract_file_info(item_path)
is_supported = FileFormatManager.is_format_supported(extension)
```

## 🎯 Avantages de cette architecture

### 1. **Élimination des doublons**
- Une seule source de vérité pour les formats supportés
- Logique de validation centralisée
- Gestion d'erreurs uniformisée

### 2. **Maintenabilité améliorée**
- Code modulaire et bien organisé
- Responsabilités clairement séparées
- Tests unitaires facilités

### 3. **Réutilisabilité**
- Modules indépendants et réutilisables
- Interfaces claires et documentées
- Configuration centralisée

### 4. **Cohérence**
- Comportement uniforme dans toute l'application
- Gestion d'erreurs standardisée
- Logging cohérent

### 5. **Extensibilité**
- Ajout facile de nouveaux formats
- Extension simple des validations
- Intégration de nouveaux statuts

## 📋 Utilisation

### Exemple d'utilisation des modules centralisés :

```python
from app.core.file_utils import FileFormatManager, FileInfoExtractor
from app.core.status_manager import StatusManager, StatusTransitionManager
from app.core.validation import FileValidator, ErrorHandler

# Vérification de format supporté
is_supported = FileFormatManager.is_format_supported("pdf")

# Extraction d'informations de fichier
file_info = FileInfoExtractor.extract_file_info(file_path)

# Validation de chemin
validation_result = FileValidator.validate_file_path(file_path)
ErrorHandler.log_validation_result(validation_result, "upload")

# Gestion de statut
status_info = StatusManager.get_status_info(FileStatus.PENDING)
can_transition = StatusTransitionManager.can_transition_to(
    FileStatus.PENDING, FileStatus.PROCESSING
)
```

## 🔧 Configuration

### Formats supportés
Les formats sont définis dans `FileFormatManager.SUPPORTED_FORMATS` :
```python
SUPPORTED_FORMATS = [
    "pdf", "docx", "doc", "txt", "eml", "msg", 
    "xlsx", "xls", "csv", "jpg", "jpeg", "png", "html"
]
```

### Statuts
Les statuts sont configurés dans `StatusManager.STATUS_CONFIG` avec leurs propriétés :
- Couleurs d'affichage
- Icônes
- Possibilité d'analyse
- Possibilité de retry

### Tailles maximales
Les tailles maximales par format sont définies dans `FileValidator.MAX_FILE_SIZES`.

## 🚀 Prochaines étapes

1. **Tests unitaires** : Créer des tests pour chaque module centralisé
2. **Documentation API** : Documenter les interfaces publiques
3. **Monitoring** : Ajouter des métriques de performance
4. **Cache** : Implémenter un système de cache pour les validations fréquentes
5. **Internationalisation** : Préparer les messages d'erreur pour l'i18n

## 📝 Notes importantes

- Tous les modules sont indépendants et peuvent être utilisés séparément
- Les erreurs sont gérées de manière cohérente avec des codes d'erreur standardisés
- Le logging est centralisé pour faciliter le debugging
- La configuration est externalisée pour faciliter les modifications 