#!/usr/bin/env python3
"""
Script de suppression du code mort
Supprime les fonctions mortes des fichiers originaux après extraction
"""

import os
import ast
from pathlib import Path
from typing import List, Dict, Tuple
import re

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
CODEMORT_DIR = PROJECT_ROOT / "codemort"

# Liste des fonctions mortes identifiées par l'audit (même que dans extract_dead_code.py)
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
        "to_dict"  # Il y en a 2, on les supprime toutes
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
        "sync_request"  # Il y en a 3, on les supprime toutes
    ],
    "backend/app/services/base_service.py": [
        "log_operation",
        "get_service_info",
        "decorator",  # Il y en a 3, on les supprime toutes
        "wrapper"     # Il y en a 3, on les supprime toutes
    ],
    "backend/app/services/config_service.py": [
        "_load_cache_logic",
        "_load_default_configs_logic",
        "_generate_pdfs_for_completed_analyses_logic"
    ]
}

def find_function_positions(source_code: str, function_name: str) -> List[Tuple[int, int]]:
    """
    Trouve toutes les positions d'une fonction dans le code source
    Retourne: [(ligne_debut, ligne_fin), ...]
    """
    positions = []
    
    try:
        tree = ast.parse(source_code)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == function_name:
                start_line = node.lineno
                end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line
                positions.append((start_line, end_line))
                
    except Exception as e:
        print(f"Erreur lors de la recherche de {function_name}: {e}")
    
    return positions

def remove_functions_from_file(file_path: str, dead_functions: List[str]) -> bool:
    """
    Supprime les fonctions mortes d'un fichier
    """
    original_path = PROJECT_ROOT / file_path
    
    if not original_path.exists():
        print(f"⚠️ Fichier source non trouvé: {file_path}")
        return False
    
    # Lire le fichier source
    with open(original_path, 'r', encoding='utf-8') as f:
        source_code = f.read()
    
    lines = source_code.split('\n')
    original_line_count = len(lines)
    
    # Trouver toutes les positions des fonctions à supprimer
    positions_to_remove = []
    for func_name in dead_functions:
        positions = find_function_positions(source_code, func_name)
        for start_line, end_line in positions:
            positions_to_remove.append((start_line, end_line, func_name))
    
    if not positions_to_remove:
        print(f"⚠️ Aucune fonction morte trouvée dans {file_path}")
        return False
    
    # Trier les positions par ordre décroissant pour éviter les problèmes d'index
    positions_to_remove.sort(reverse=True, key=lambda x: x[0])
    
    # Supprimer les fonctions
    removed_lines = 0
    for start_line, end_line, func_name in positions_to_remove:
        print(f"🗑️ Suppression: {func_name} (lignes {start_line}-{end_line})")
        
        # Supprimer les lignes (index 0-based)
        del lines[start_line - 1:end_line]
        removed_lines += end_line - start_line + 1
    
    # Reconstruire le code
    new_source_code = '\n'.join(lines)
    
    # Sauvegarder une copie de sauvegarde
    backup_path = original_path.with_suffix(original_path.suffix + '.backup')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(source_code)
    
    # Écrire le nouveau code
    with open(original_path, 'w', encoding='utf-8') as f:
        f.write(new_source_code)
    
    new_line_count = len(lines)
    print(f"✅ Fichier modifié: {file_path}")
    print(f"   - Lignes supprimées: {removed_lines}")
    print(f"   - Lignes avant: {original_line_count}")
    print(f"   - Lignes après: {new_line_count}")
    print(f"   - Sauvegarde: {backup_path.name}")
    
    return True

def create_removal_report():
    """
    Crée un rapport de suppression
    """
    report_path = CODEMORT_DIR / "RAPPORT_SUPPRESSION.md"
    
    content = f"""# 🗑️ RAPPORT DE SUPPRESSION DU CODE MORT

**Date de suppression:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Projet:** Docusense AI

## 📊 Statistiques de suppression

- **Fichiers traités:** {len(DEAD_FUNCTIONS)}
- **Fonctions supprimées:** {sum(len(funcs) for funcs in DEAD_FUNCTIONS.values())}

## 📄 Fichiers modifiés

"""
    
    for file_path, functions in DEAD_FUNCTIONS.items():
        if functions:
            content += f"""
### 📄 {file_path}
- **Fonctions supprimées:** {len(functions)}
- **Fonctions:** {', '.join(functions)}
"""
    
    content += f"""
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
"""
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"📋 Rapport de suppression créé: {report_path}")

def main():
    """
    Fonction principale de suppression
    """
    print("🗑️ Début de la suppression du code mort...")
    print(f"📁 Répertoire de sauvegarde: {CODEMORT_DIR}")
    print("=" * 60)
    
    modified_files = []
    
    # Traiter chaque fichier
    for file_path, dead_functions in DEAD_FUNCTIONS.items():
        if dead_functions:
            print(f"\n🔍 Traitement de: {file_path}")
            if remove_functions_from_file(file_path, dead_functions):
                modified_files.append(file_path)
    
    # Créer le rapport de suppression
    print(f"\n📋 Création du rapport de suppression...")
    create_removal_report()
    
    print(f"\n🎉 Suppression terminée!")
    print(f"📊 Fichiers modifiés: {len(modified_files)}")
    print(f"📁 Code mort conservé dans: {CODEMORT_DIR}")

if __name__ == "__main__":
    from datetime import datetime
    main()
