# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/database.py
# Fonctions extraites: 3
# Lignes totales extraites: 39
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: create_tables
# Lignes originales: 49-63
# =============================================================================

def create_tables():
    """
    Create all tables in the database
    """
    try:
        # Import all models to ensure they are registered
        from app.models import File, Analysis, QueueItem, Config

        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise


# =============================================================================
# FONCTION: drop_tables
# Lignes originales: 66-76
# =============================================================================

def drop_tables():
    """
    Drop all tables in the database (use with caution!)
    """
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")

    except Exception as e:
        logger.error(f"Error dropping database tables: {str(e)}")
        raise


# =============================================================================
# FONCTION: check_database_connection
# Lignes originales: 79-91
# =============================================================================

def check_database_connection():
    """
    Check if database connection is working
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True

    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

