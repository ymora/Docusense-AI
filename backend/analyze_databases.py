#!/usr/bin/env python3
"""
Script d'analyse rapide des bases de données
"""

import sqlite3
import os
from pathlib import Path

def analyze_database(db_path):
    """Analyser une base de données SQLite"""
    if not os.path.exists(db_path):
        print(f"❌ Base de données non trouvée : {db_path}")
        return
    
    try:
        db = sqlite3.connect(db_path)
        cursor = db.cursor()
        
        # Obtenir les tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print(f"\n📊 Base de données : {db_path}")
        print(f"📁 Taille : {os.path.getsize(db_path) / (1024*1024):.1f} MB")
        print(f"📋 Tables ({len(tables)}):")
        
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  - {table_name}: {count} enregistrements")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse de {db_path}: {e}")

def main():
    """Analyse rapide des bases de données"""
    print("🔍 ANALYSE RAPIDE DES BASES DE DONNÉES")
    print("=" * 50)
    
    # Analyser les bases existantes
    databases = [
        "docusense.db",  # Backend
        "../docusense.db"  # Racine
    ]
    
    for db_path in databases:
        analyze_database(db_path)
    
    print("\n✅ Analyse terminée")

if __name__ == "__main__":
    main()
