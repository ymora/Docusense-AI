#!/usr/bin/env python3
"""
Migration script to add pdf_path column to analyses table
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.analysis import Base


def migrate_add_pdf_path():
    """Add pdf_path column to analyses table"""
    print("🔄 Début de la migration: ajout de la colonne pdf_path...")
    
    try:
        # Create engine
        engine = create_engine(settings.database_url)
        
        # Check if column already exists (SQLite specific)
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(analyses)"))
            columns = result.fetchall()
            
            # Check if pdf_path column exists
            column_exists = any(col[1] == 'pdf_path' for col in columns)
            
            if column_exists:
                print("✅ La colonne pdf_path existe déjà")
                return
        
        # Add the column
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE analyses ADD COLUMN pdf_path VARCHAR(500)"))
            conn.commit()
        
        print("✅ Colonne pdf_path ajoutée avec succès")
        
        # Verify the column was added
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(analyses)"))
            columns = result.fetchall()
            
            column_exists = any(col[1] == 'pdf_path' for col in columns)
            
            if column_exists:
                print("✅ Vérification: la colonne pdf_path a été créée correctement")
            else:
                print("❌ Erreur: la colonne pdf_path n'a pas été créée")
                
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {str(e)}")
        raise


if __name__ == "__main__":
    migrate_add_pdf_path()
