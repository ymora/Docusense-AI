"""
Unit tests for database utils module
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database_utils import DatabaseUtils, QueryBuilder, DatabaseValidator, DatabaseMetrics


class TestDatabaseUtils:
    """Test cases for DatabaseUtils class"""
    
    @pytest.fixture
    def mock_session(self):
        """Mock database session"""
        session = Mock(spec=Session)
        session.is_active = True
        return session
    
    def test_safe_transaction_success(self, mock_session):
        """Test successful safe transaction"""
        with DatabaseUtils.safe_transaction(mock_session) as session:
            assert session == mock_session
        
        mock_session.commit.assert_called_once()
        mock_session.rollback.assert_not_called()
    
    def test_safe_transaction_error(self, mock_session):
        """Test safe transaction with error"""
        mock_session.commit.side_effect = SQLAlchemyError("Database error")
        
        with pytest.raises(SQLAlchemyError):
            with DatabaseUtils.safe_transaction(mock_session) as session:
                raise SQLAlchemyError("Test error")
        
        mock_session.rollback.assert_called_once()
    
    def test_bulk_operation_success(self, mock_session):
        """Test successful bulk operation"""
        items = [1, 2, 3, 4, 5]
        
        def operation_func(session, item):
            return item * 2
        
        result = DatabaseUtils.bulk_operation(mock_session, operation_func, items, batch_size=2)
        
        assert result == 5
        assert mock_session.commit.call_count == 3  # 3 batches
    
    def test_bulk_operation_with_errors(self, mock_session):
        """Test bulk operation with some errors"""
        items = [1, 2, 3, 4, 5]
        
        def operation_func(session, item):
            if item == 3:
                raise ValueError("Test error")
            return item * 2
        
        result = DatabaseUtils.bulk_operation(mock_session, operation_func, items, batch_size=2)
        
        assert result == 4  # 5 items - 1 error
        assert mock_session.commit.call_count == 3
    
    def test_safe_query_success(self, mock_session):
        """Test successful safe query"""
        def query_func(session, *args, **kwargs):
            return [{"id": 1, "name": "test"}]
        
        result = DatabaseUtils.safe_query(mock_session, query_func, "test_arg")
        
        assert result == [{"id": 1, "name": "test"}]
    
    def test_safe_query_error(self, mock_session):
        """Test safe query with error"""
        def query_func(session, *args, **kwargs):
            raise SQLAlchemyError("Query error")
        
        with pytest.raises(SQLAlchemyError):
            DatabaseUtils.safe_query(mock_session, query_func)


class TestQueryBuilder:
    """Test cases for QueryBuilder class"""
    
    def test_build_file_filters_all_none(self):
        """Test building file filters with no parameters"""
        filters = QueryBuilder.build_file_filters()
        
        assert len(filters) == 0
    
    def test_build_file_filters_with_directory(self):
        """Test building file filters with directory"""
        filters = QueryBuilder.build_file_filters(directory="/test/path")
        
        assert len(filters) == 1
        assert "directory" in str(filters[0])
    
    def test_build_file_filters_with_status(self):
        """Test building file filters with status"""
        filters = QueryBuilder.build_file_filters(status="completed")
        
        assert len(filters) == 1
        assert "status" in str(filters[0])
    
    def test_build_file_filters_with_search(self):
        """Test building file filters with search"""
        filters = QueryBuilder.build_file_filters(search="test")
        
        assert len(filters) == 1
        assert "or_" in str(filters[0])
    
    def test_build_file_filters_with_format_category(self):
        """Test building file filters with format category"""
        filters = QueryBuilder.build_file_filters(format_category="document")
        
        assert len(filters) == 1
        assert "format_category" in str(filters[0])
    
    def test_build_file_filters_combined(self):
        """Test building file filters with multiple parameters"""
        filters = QueryBuilder.build_file_filters(
            directory="/test/path",
            status="completed",
            search="test",
            format_category="document"
        )
        
        assert len(filters) == 4
    
    def test_build_pagination_query(self):
        """Test building pagination query"""
        mock_query = Mock()
        
        result = QueryBuilder.build_pagination_query(mock_query, limit=10, offset=20)
        
        assert result == mock_query
        mock_query.limit.assert_called_once_with(10)
        mock_query.offset.assert_called_once_with(20)


class TestDatabaseValidator:
    """Test cases for DatabaseValidator class"""
    
    @pytest.fixture
    def mock_session(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    def test_validate_file_exists_true(self, mock_session):
        """Test file exists validation - file exists"""
        mock_session.query.return_value.filter.return_value.first.return_value = Mock()
        
        result = DatabaseValidator.validate_file_exists(mock_session, 1)
        
        assert result is True
        mock_session.query.assert_called_once()
    
    def test_validate_file_exists_false(self, mock_session):
        """Test file exists validation - file doesn't exist"""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = DatabaseValidator.validate_file_exists(mock_session, 999)
        
        assert result is False
    
    def test_validate_directory_exists_true(self, mock_session):
        """Test directory exists validation - directory exists"""
        mock_session.query.return_value.filter.return_value.first.return_value = Mock()
        
        result = DatabaseValidator.validate_directory_exists(mock_session, "/test/path")
        
        assert result is True
        mock_session.query.assert_called_once()
    
    def test_validate_directory_exists_false(self, mock_session):
        """Test directory exists validation - directory doesn't exist"""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = DatabaseValidator.validate_directory_exists(mock_session, "/nonexistent/path")
        
        assert result is False


class TestDatabaseMetrics:
    """Test cases for DatabaseMetrics class"""
    
    @pytest.fixture
    def mock_session(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    def test_get_file_count_by_status_with_directory(self, mock_session):
        """Test getting file count by status with directory filter"""
        mock_session.query.return_value.filter.return_value.group_by.return_value.all.return_value = [
            ("completed", 5),
            ("pending", 3),
            ("failed", 1)
        ]
        
        result = DatabaseMetrics.get_file_count_by_status(mock_session, "/test/path")
        
        assert result["completed"] == 5
        assert result["pending"] == 3
        assert result["failed"] == 1
        mock_session.query.assert_called_once()
    
    def test_get_file_count_by_status_no_directory(self, mock_session):
        """Test getting file count by status without directory filter"""
        mock_session.query.return_value.group_by.return_value.all.return_value = [
            ("completed", 10),
            ("pending", 5)
        ]
        
        result = DatabaseMetrics.get_file_count_by_status(mock_session)
        
        assert result["completed"] == 10
        assert result["pending"] == 5
        mock_session.query.assert_called_once()
    
    def test_get_total_file_count_with_directory(self, mock_session):
        """Test getting total file count with directory filter"""
        mock_session.query.return_value.filter.return_value.count.return_value = 15
        
        result = DatabaseMetrics.get_total_file_count(mock_session, "/test/path")
        
        assert result == 15
        mock_session.query.assert_called_once()
    
    def test_get_total_file_count_no_directory(self, mock_session):
        """Test getting total file count without directory filter"""
        mock_session.query.return_value.count.return_value = 25
        
        result = DatabaseMetrics.get_total_file_count(mock_session)
        
        assert result == 25
        mock_session.query.assert_called_once() 