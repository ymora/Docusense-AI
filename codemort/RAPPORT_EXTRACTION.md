# 📋 RAPPORT D'EXTRACTION DU CODE MORT

**Date d'extraction:** 2025-08-11 01:32:25
**Projet:** Docusense AI

## 📊 Statistiques d'extraction


### 📄 backend/app/api/pdf_files.py
- **Fonctions extraites:** 2
- **Fonctions:** _generate_pdfs_for_all_completed_analyses_logic, _list_analysis_pdfs_logic

### 📄 backend/app/core/cache.py
- **Fonctions extraites:** 4
- **Fonctions:** to_dict, cleanup_worker, decorator, wrapper

### 📄 backend/app/core/config.py
- **Fonctions extraites:** 2
- **Fonctions:** parse_cors_origins, validate_secret_key

### 📄 backend/app/core/database.py
- **Fonctions extraites:** 3
- **Fonctions:** create_tables, drop_tables, check_database_connection

### 📄 backend/app/core/database_utils.py
- **Fonctions extraites:** 8
- **Fonctions:** safe_transaction, bulk_operation, safe_query, build_file_filters, build_pagination_query, validate_file_exists, validate_directory_exists, get_total_file_count

### 📄 backend/app/core/file_utils.py
- **Fonctions extraites:** 7
- **Fonctions:** extract_file_info, extract_unsupported_file_info, get_browser_optimized_mime_type, extract_directory_info, normalize_path, is_subdirectory, get_relative_path

### 📄 backend/app/core/file_validation.py
- **Fonctions extraites:** 2
- **Fonctions:** validate_directory_path, get_supported_formats_for_type

### 📄 backend/app/core/media_formats.py
- **Fonctions extraites:** 3
- **Fonctions:** is_supported_format, get_extensions_by_type, get_mime_types_by_type

### 📄 backend/app/core/performance_monitor.py
- **Fonctions extraites:** 5
- **Fonctions:** monitor_performance, log_performance_summary, get_average, decorator, wrapper

### 📄 backend/app/core/security.py
- **Fonctions extraites:** 8
- **Fonctions:** generate_token, verify_token, encrypt_data, decrypt_data, generate_salt, hash_with_salt, is_strong_password, sanitize_input

### 📄 backend/app/core/status_manager.py
- **Fonctions extraites:** 20
- **Fonctions:** get_status_color, get_status_label, get_status_icon, format_status_message, is_status_transition_valid, _status_manager_init, update_status, get_current_status, get_status_history, clear_history, clear_all_history, get_all_statuses, get_status_colors, can_analyze_file, can_retry_file, get_status_summary, get_allowed_transitions, validate_transition, analyze_status_distribution, get_status_priority

### 📄 backend/app/core/types.py
- **Fonctions extraites:** 1
- **Fonctions:** to_dict

### 📄 backend/app/core/validation.py
- **Fonctions extraites:** 5
- **Fonctions:** validate_required_fields, validate_string_length, validate_integer_range, log_validation_result, handle_exception

### 📄 backend/app/middleware/auth_middleware.py
- **Fonctions extraites:** 3
- **Fonctions:** get_current_session, get_current_session_optional, require_admin

### 📄 backend/app/services/ai_service.py
- **Fonctions extraites:** 9
- **Fonctions:** _load_providers_logic, _load_default_providers, _handle_specific_provider_request, save_provider_config, get_provider_config, delete_provider_config, clear_cache, get_cache_size, sync_request

### 📄 backend/app/services/base_service.py
- **Fonctions extraites:** 4
- **Fonctions:** log_operation, get_service_info, decorator, wrapper

### 📄 backend/app/services/config_service.py
- **Fonctions extraites:** 3
- **Fonctions:** _load_cache_logic, _load_default_configs_logic, _generate_pdfs_for_completed_analyses_logic

## 🎯 Résumé global

- **Fichiers traités:** 17
- **Fonctions extraites:** 89
- **Répertoire de destination:** `codemort/`

## 📁 Structure du répertoire codemort

```
codemort/
├── api/           # Fonctions mortes des API routes
├── core/          # Fonctions mortes du core
├── services/      # Fonctions mortes des services
├── middleware/    # Fonctions mortes du middleware
└── RAPPORT_EXTRACTION.md
```

## 🔄 Comment réintégrer le code

Pour réintégrer une fonction morte dans le code principal :

1. Ouvrir le fichier correspondant dans `codemort/`
2. Copier la fonction souhaitée
3. La coller dans le fichier original
4. Supprimer le fichier de `codemort/` si plus nécessaire

## ⚠️ Notes importantes

- Les fonctions extraites sont **vraiment mortes** (non utilisées)
- Elles peuvent être réintégrées si besoin futur
- Vérifier les dépendances avant réintégration
- Tester après réintégration

---
*Extrait automatiquement par le script d'audit Docusense AI*
