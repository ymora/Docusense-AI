#!/usr/bin/env python3
"""
Script d'extraction du code mort
Extrait toutes les fonctions mortes identifiées par l'audit et les place dans le répertoire codemort
"""

import os
import ast
import shutil
from pathlib import Path
from typing import List, Dict, Tuple
import re

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
CODEMORT_DIR = PROJECT_ROOT / "codemort"

# Liste des fonctions mortes identifiées par l'audit
DEAD_FUNCTIONS = {
    # API
    "backend/app/api/pdf_files.py": [
        "_generate_pdfs_for_all_completed_analyses_logic",
        "_list_analysis_pdfs_logic"
    ],
    
    # Core
    "backend/app/core/cache.py": [
        "to_dict",
        "cleanup_worker", 
        "decorator",
        "wrapper"
    ],
    "backend/app/core/config.py": [
        "parse_cors_origins",
        "validate_secret_key"
    ],
    "backend/app/core/database.py": [
        "create_tables",
        "drop_tables",
        "check_database_connection"
    ],
    "backend/app/core/database_utils.py": [
        "safe_transaction",
        "bulk_operation",
        "safe_query",
        "build_file_filters",
        "build_pagination_query",
        "validate_file_exists",
        "validate_directory_exists",
        "get_total_file_count"
    ],
    "backend/app/core/file_utils.py": [
        "extract_file_info",
        "extract_unsupported_file_info",
        "get_browser_optimized_mime_type",
        "extract_directory_info",
        "normalize_path",
        "is_subdirectory",
        "get_relative_path"
    ],
    "backend/app/core/file_validation.py": [
        "validate_directory_path",
        "get_supported_formats_for_type"
    ],
    "backend/app/core/media_formats.py": [
        "is_supported_format",
        "get_extensions_by_type",
        "get_mime_types_by_type"
    ],
    "backend/app/core/performance_monitor.py": [
        "monitor_performance",
        "log_performance_summary",
        "get_average",
        "decorator",
        "wrapper"
    ],
    "backend/app/core/security.py": [
        "generate_token",
        "verify_token",
        "encrypt_data",
        "decrypt_data",
        "generate_salt",
        "hash_with_salt",
        "is_strong_password",
        "sanitize_input"
    ],
    "backend/app/core/status_manager.py": [
        "get_status_color",
        "get_status_label",
        "get_status_icon",
        "format_status_message",
        "is_status_transition_valid",
        "_status_manager_init",
        "update_status",
        "get_current_status",
        "get_status_history",
        "clear_history",
        "clear_all_history",
        "get_all_statuses",
        "get_status_colors",
        "can_analyze_file",
        "can_retry_file",
        "get_status_summary",
        "get_allowed_transitions",
        "validate_transition",
        "analyze_status_distribution",
        "get_status_priority"
    ],
    "backend/app/core/types.py": [
        "to_dict"  # Il y en a 2, on les extrait toutes
    ],
    "backend/app/core/validation.py": [
        "validate_required_fields",
        "validate_string_length",
        "validate_integer_range",
        "log_validation_result",
        "handle_exception"
    ],
    
    # Middleware
    "backend/app/middleware/auth_middleware.py": [
        "get_current_session",
        "get_current_session_optional",
        "require_admin"
    ],
    
    # Services
    "backend/app/services/ai_service.py": [
        "_load_providers_logic",
        "_load_default_providers",
        "_handle_specific_provider_request",
        "save_provider_config",
        "get_provider_config",
        "delete_provider_config",
        "clear_cache",
        "get_cache_size",
        "sync_request"  # Il y en a 3, on les extrait toutes
    ],
    "backend/app/services/base_service.py": [
        "log_operation",
        "get_service_info",
        "decorator",  # Il y en a 3, on les extrait toutes
        "wrapper"     # Il y en a 3, on les extrait toutes
    ],
    "backend/app/services/config_service.py": [
        "_load_cache_logic",
        "_load_default_configs_logic",
        "_generate_pdfs_for_completed_analyses_logic"
    ]
}

def extract_function_code(source_code: str, function_name: str) -> Tuple[str, int, int]:
    """
    Extrait le code d'une fonction spécifique du code source
    Retourne: (code_fonction, ligne_debut, ligne_fin)
    """
    try:
        tree = ast.parse(source_code)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == function_name:
                # Calculer les lignes de début et fin
                start_line = node.lineno
                end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line
                
                # Extraire le code de la fonction
                lines = source_code.split('\n')
                function_lines = lines[start_line - 1:end_line]
                function_code = '\n'.join(function_lines)
                
                return function_code, start_line, end_line
                
    except Exception as e:
        print(f"Erreur lors de l'extraction de {function_name}: {e}")
    
    return "", 0, 0

def create_dead_code_file(original_file: str, dead_functions: List[str]) -> str:
    """
    Crée un fichier dans codemort avec les fonctions mortes extraites
    """
    original_path = PROJECT_ROOT / original_file
    
    if not original_path.exists():
        print(f"⚠️ Fichier source non trouvé: {original_file}")
        return ""
    
    # Lire le fichier source
    with open(original_path, 'r', encoding='utf-8') as f:
        source_code = f.read()
    
    # Déterminer le nom du fichier de destination
    file_name = original_path.name
    category = original_path.parent.name  # api, core, services, middleware
    
    # Créer le fichier de destination
    dest_path = CODEMORT_DIR / category / file_name
    
    # Extraire les fonctions mortes
    extracted_functions = []
    total_lines_removed = 0
    
    for func_name in dead_functions:
        func_code, start_line, end_line = extract_function_code(source_code, func_name)
        
        if func_code:
            extracted_functions.append({
                'name': func_name,
                'code': func_code,
                'start_line': start_line,
                'end_line': end_line,
                'lines_count': end_line - start_line + 1
            })
            total_lines_removed += end_line - start_line + 1
            print(f"✅ Extrait: {func_name} (lignes {start_line}-{end_line})")
        else:
            print(f"⚠️ Fonction non trouvée: {func_name}")
    
    if not extracted_functions:
        print(f"❌ Aucune fonction morte trouvée dans {original_file}")
        return ""
    
    # Créer le contenu du fichier de destination
    content = f"""# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: {original_file}
# Fonctions extraites: {len(extracted_functions)}
# Lignes totales extraites: {total_lines_removed}
# Date d'extraction: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================

"""
    
    # Ajouter chaque fonction extraite
    for func in extracted_functions:
        content += f"""
# =============================================================================
# FONCTION: {func['name']}
# Lignes originales: {func['start_line']}-{func['end_line']}
# =============================================================================

{func['code']}

"""
    
    # Écrire le fichier
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"📄 Fichier créé: {dest_path}")
    print(f"   - {len(extracted_functions)} fonctions extraites")
    print(f"   - {total_lines_removed} lignes totales")
    
    return str(dest_path)

def create_summary_report():
    """
    Crée un rapport de synthèse de l'extraction
    """
    summary_path = CODEMORT_DIR / "RAPPORT_EXTRACTION.md"
    
    total_files = 0
    total_functions = 0
    total_lines = 0
    
    content = f"""# 📋 RAPPORT D'EXTRACTION DU CODE MORT

**Date d'extraction:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Projet:** Docusense AI

## 📊 Statistiques d'extraction

"""
    
    for original_file, functions in DEAD_FUNCTIONS.items():
        if functions:
            total_files += 1
            total_functions += len(functions)
            content += f"""
### 📄 {original_file}
- **Fonctions extraites:** {len(functions)}
- **Fonctions:** {', '.join(functions)}
"""
    
    content += f"""
## 🎯 Résumé global

- **Fichiers traités:** {total_files}
- **Fonctions extraites:** {total_functions}
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
"""
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"📋 Rapport créé: {summary_path}")

def main():
    """
    Fonction principale d'extraction
    """
    print("🚀 Début de l'extraction du code mort...")
    print(f"📁 Répertoire de destination: {CODEMORT_DIR}")
    print("=" * 60)
    
    # Créer le répertoire codemort s'il n'existe pas
    CODEMORT_DIR.mkdir(exist_ok=True)
    
    extracted_files = []
    
    # Traiter chaque fichier
    for original_file, dead_functions in DEAD_FUNCTIONS.items():
        if dead_functions:
            print(f"\n🔍 Traitement de: {original_file}")
            dest_file = create_dead_code_file(original_file, dead_functions)
            if dest_file:
                extracted_files.append(dest_file)
    
    # Créer le rapport de synthèse
    print(f"\n📋 Création du rapport de synthèse...")
    create_summary_report()
    
    print(f"\n🎉 Extraction terminée!")
    print(f"📊 Fichiers extraits: {len(extracted_files)}")
    print(f"📁 Répertoire: {CODEMORT_DIR}")

if __name__ == "__main__":
    from datetime import datetime
    main()
