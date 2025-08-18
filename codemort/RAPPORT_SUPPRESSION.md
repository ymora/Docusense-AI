# 🗑️ RAPPORT DE SUPPRESSION DU CODE MORT

**Date de suppression:** 2025-08-11 01:33:06
**Projet:** Docusense AI

## 📊 Statistiques de suppression

- **Fichiers traités:** 17
- **Fonctions supprimées:** 89

## 📄 Fichiers modifiés


### 📄 backend/app/api/pdf_files.py
- **Fonctions supprimées:** 2
- **Fonctions:** _generate_pdfs_for_all_completed_analyses_logic, _list_analysis_pdfs_logic

### 📄 backend/app/core/cache.py
- **Fonctions supprimées:** 4
- **Fonctions:** to_dict, cleanup_worker, decorator, wrapper

### 📄 backend/app/core/config.py
- **Fonctions supprimées:** 2
- **Fonctions:** parse_cors_origins, validate_secret_key

### 📄 backend/app/core/database.py
- **Fonctions supprimées:** 3
- **Fonctions:** create_tables, drop_tables, check_database_connection

### 📄 backend/app/core/database_utils.py
- **Fonctions supprimées:** 8
- **Fonctions:** safe_transaction, bulk_operation, safe_query, build_file_filters, build_pagination_query, validate_file_exists, validate_directory_exists, get_total_file_count

### 📄 backend/app/core/file_utils.py
- **Fonctions supprimées:** 7
- **Fonctions:** extract_file_info, extract_unsupported_file_info, get_browser_optimized_mime_type, extract_directory_info, normalize_path, is_subdirectory, get_relative_path

### 📄 backend/app/core/file_validation.py
- **Fonctions supprimées:** 2
- **Fonctions:** validate_directory_path, get_supported_formats_for_type

### 📄 backend/app/core/media_formats.py
- **Fonctions supprimées:** 3
- **Fonctions:** is_supported_format, get_extensions_by_type, get_mime_types_by_type

### 📄 backend/app/core/performance_monitor.py
- **Fonctions supprimées:** 5
- **Fonctions:** monitor_performance, log_performance_summary, get_average, decorator, wrapper

### 📄 backend/app/core/security.py
- **Fonctions supprimées:** 8
- **Fonctions:** generate_token, verify_token, encrypt_data, decrypt_data, generate_salt, hash_with_salt, is_strong_password, sanitize_input

### 📄 backend/app/core/status_manager.py
- **Fonctions supprimées:** 20
- **Fonctions:** get_status_color, get_status_label, get_status_icon, format_status_message, is_status_transition_valid, _status_manager_init, update_status, get_current_status, get_status_history, clear_history, clear_all_history, get_all_statuses, get_status_colors, can_analyze_file, can_retry_file, get_status_summary, get_allowed_transitions, validate_transition, analyze_status_distribution, get_status_priority

### 📄 backend/app/core/types.py
- **Fonctions supprimées:** 1
- **Fonctions:** to_dict

### 📄 backend/app/core/validation.py
- **Fonctions supprimées:** 5
- **Fonctions:** validate_required_fields, validate_string_length, validate_integer_range, log_validation_result, handle_exception

### 📄 backend/app/middleware/auth_middleware.py
- **Fonctions supprimées:** 3
- **Fonctions:** get_current_session, get_current_session_optional, require_admin

### 📄 backend/app/services/ai_service.py
- **Fonctions supprimées:** 9
- **Fonctions:** _load_providers_logic, _load_default_providers, _handle_specific_provider_request, save_provider_config, get_provider_config, delete_provider_config, clear_cache, get_cache_size, sync_request

### 📄 backend/app/services/base_service.py
- **Fonctions supprimées:** 4
- **Fonctions:** log_operation, get_service_info, decorator, wrapper

### 📄 backend/app/services/config_service.py
- **Fonctions supprimées:** 3
- **Fonctions:** _load_cache_logic, _load_default_configs_logic, _generate_pdfs_for_completed_analyses_logic

## ⚠️ Sauvegardes créées

Chaque fichier modifié a une sauvegarde avec l'extension `.backup`

## 🔄 Comment restaurer

Pour restaurer un fichier :

1. Renommer le fichier `.backup` en remplaçant l'original
2. Ou copier le contenu du fichier de sauvegarde

## 📁 Code mort conservé

Le code mort est conservé dans le répertoire `codemort/` pour réutilisation future.

---
*Supprimé automatiquement par le script d'audit Docusense AI*
