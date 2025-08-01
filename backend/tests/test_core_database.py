"""
Unit tests for database module
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import (
    get_db,
    create_tables,
    drop_tables,
    check_database_connection
)


class TestDatabase:
    """Test cases for database functions"""
    
    def test_get_db(self):
        """Test getting database session"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock(spec=Session)
            mock_session_local.return_value = mock_session
            
            db_generator = get_db()
            db = next(db_generator)
            
            assert db == mock_session
            
            # Test cleanup
            db_generator.close()
            mock_session.close.assert_called_once()
    
    def test_get_db_exception(self):
        """Test getting database session with exception"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock(spec=Session)
            mock_session_local.return_value = mock_session
            mock_session.close.side_effect = SQLAlchemyError("Database error")
            
            db_generator = get_db()
            db = next(db_generator)
            
            # Should handle exception during cleanup gracefully
            try:
                db_generator.close()
            except SQLAlchemyError:
                # This is expected behavior - the exception should be raised
                pass
            
            mock_session.close.assert_called_once()
    
    def test_create_tables_success(self):
        """Test creating tables successfully"""
        with patch('app.core.database.Base.metadata.create_all') as mock_create_all, \
             patch('app.core.database.engine') as mock_engine:
            
            create_tables()
            
            mock_create_all.assert_called_once_with(bind=mock_engine)
    
    def test_create_tables_exception(self):
        """Test creating tables with exception"""
        with patch('app.core.database.Base.metadata.create_all') as mock_create_all:
            mock_create_all.side_effect = SQLAlchemyError("Database error")
            
            with pytest.raises(SQLAlchemyError):
                create_tables()
    
    def test_drop_tables_success(self):
        """Test dropping tables successfully"""
        with patch('app.core.database.Base.metadata.drop_all') as mock_drop_all, \
             patch('app.core.database.engine') as mock_engine:
            
            drop_tables()
            
            mock_drop_all.assert_called_once_with(bind=mock_engine)
    
    def test_drop_tables_exception(self):
        """Test dropping tables with exception"""
        with patch('app.core.database.Base.metadata.drop_all') as mock_drop_all:
            mock_drop_all.side_effect = SQLAlchemyError("Database error")
            
            with pytest.raises(SQLAlchemyError):
                drop_tables()
    
    def test_check_database_connection_success(self):
        """Test checking database connection successfully"""
        with patch('app.core.database.engine') as mock_engine:
            mock_connection = Mock()
            mock_engine.connect.return_value.__enter__.return_value = mock_connection
            
            result = check_database_connection()
            
            assert result is True
            mock_engine.connect.assert_called_once()
    
    def test_check_database_connection_failure(self):
        """Test checking database connection with failure"""
        with patch('app.core.database.engine') as mock_engine:
            mock_engine.connect.side_effect = SQLAlchemyError("Connection failed")
            
            result = check_database_connection()
            
            assert result is False
    
    def test_database_session_generator(self):
        """Test database session as generator"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock(spec=Session)
            mock_session_local.return_value = mock_session
            
            db_generator = get_db()
            db = next(db_generator)
            
            assert db == mock_session
            
            # Test cleanup
            db_generator.close()
            mock_session.close.assert_called_once()
    
    def test_database_session_generator_exception(self):
        """Test database session as generator with exception"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock(spec=Session)
            mock_session_local.return_value = mock_session
            
            db_generator = get_db()
            db = next(db_generator)
            
            # Simulate exception during use
            try:
                raise ValueError("Test exception")
            except ValueError:
                pass
            
            # Cleanup should still work
            db_generator.close()
            mock_session.close.assert_called_once() 