"""
Unit tests for performance monitor module
"""

import pytest
from unittest.mock import Mock, patch
import time
from datetime import datetime

from app.core.performance_monitor import (
    PerformanceMonitor,
    monitor_performance,
    performance_monitor
)


class TestPerformanceMonitor:
    """Test cases for PerformanceMonitor"""
    
    @pytest.fixture
    def monitor(self):
        """PerformanceMonitor instance for testing"""
        return PerformanceMonitor()
    
    def test_init(self, monitor):
        """Test PerformanceMonitor initialization"""
        assert monitor is not None
        assert hasattr(monitor, 'metrics')
        assert hasattr(monitor, 'start_time')
        assert hasattr(monitor, 'lock')
    
    def test_record_metric(self, monitor):
        """Test recording a metric"""
        monitor.record_metric("test_metric", 42.5, {"tag1": "value1"})
        
        assert "test_metric" in monitor.metrics
        assert len(monitor.metrics["test_metric"]) == 1
        metric = monitor.metrics["test_metric"][0]
        assert metric["value"] == 42.5
        assert metric["tags"] == {"tag1": "value1"}
        assert "timestamp" in metric
    
    def test_record_metric_no_tags(self, monitor):
        """Test recording a metric without tags"""
        monitor.record_metric("test_metric", 42.5)
        
        metric = monitor.metrics["test_metric"][0]
        assert metric["tags"] == {}
    
    def test_get_average_with_data(self, monitor):
        """Test getting average with data"""
        monitor.record_metric("test_metric", 10.0)
        monitor.record_metric("test_metric", 20.0)
        monitor.record_metric("test_metric", 30.0)
        
        average = monitor.get_average("test_metric")
        assert average == 20.0
    
    def test_get_average_no_data(self, monitor):
        """Test getting average with no data"""
        average = monitor.get_average("nonexistent_metric")
        assert average == 0.0
    
    def test_get_average_with_window(self, monitor):
        """Test getting average with time window"""
        monitor.record_metric("test_metric", 10.0)
        time.sleep(0.1)  # Small delay
        monitor.record_metric("test_metric", 20.0)
        
        # Get average with very short window
        average = monitor.get_average("test_metric", window_seconds=0.05)
        assert average == 20.0  # Only the second value should be included
    
    def test_get_summary(self, monitor):
        """Test getting performance summary"""
        monitor.record_metric("test_metric", 10.0)
        monitor.record_metric("test_metric", 20.0)
        
        summary = monitor.get_summary()
        
        assert "uptime_seconds" in summary
        assert "system_memory_mb" in summary
        assert "system_cpu_percent" in summary
        assert "metrics" in summary
        assert "test_metric" in summary["metrics"]
        
        metric_summary = summary["metrics"]["test_metric"]
        assert metric_summary["count"] == 2
        assert metric_summary["average"] == 15.0
        assert metric_summary["min"] == 10.0
        assert metric_summary["max"] == 20.0
        assert metric_summary["last_value"] == 20.0


class TestPerformanceDecorator:
    """Test cases for performance decorator"""
    
    def test_monitor_performance_success(self):
        """Test performance monitoring decorator with success"""
        @monitor_performance("test_function")
        def test_function():
            return "success"
        
        result = test_function()
        assert result == "success"
        
        # Check that metrics were recorded
        metrics = performance_monitor.metrics
        assert "test_function_success" in metrics
        assert len(metrics["test_function_success"]) == 1
    
    def test_monitor_performance_with_args(self):
        """Test performance monitoring decorator with arguments"""
        @monitor_performance("test_function_with_args")
        def test_function_with_args(value):
            return f"success: {value}"
        
        result = test_function_with_args("test")
        assert result == "success: test"
        
        # Check that metrics were recorded
        metrics = performance_monitor.metrics
        assert "test_function_with_args_success" in metrics
    
    def test_monitor_performance_with_tags(self):
        """Test performance monitoring decorator with tags"""
        @monitor_performance("test_function_with_tags", {"tag1": "value1"})
        def test_function_with_tags():
            return "success"
        
        result = test_function_with_tags()
        assert result == "success"
        
        # Check that metrics were recorded with tags
        metrics = performance_monitor.metrics
        assert "test_function_with_tags_success" in metrics
        metric = metrics["test_function_with_tags_success"][0]
        assert metric["tags"] == {"tag1": "value1"}
    
    def test_monitor_performance_exception(self):
        """Test performance monitoring decorator with exception"""
        @monitor_performance("test_function_exception")
        def test_function_exception():
            raise ValueError("Test exception")
        
        with pytest.raises(ValueError):
            test_function_exception()
        
        # Check that error metrics were recorded
        metrics = performance_monitor.metrics
        assert "test_function_exception_error" in metrics
        assert len(metrics["test_function_exception_error"]) == 1


class TestGlobalPerformanceMonitor:
    """Test cases for global performance monitor"""
    
    def test_global_monitor_instance(self):
        """Test that global monitor is an instance of PerformanceMonitor"""
        assert isinstance(performance_monitor, PerformanceMonitor)
    
    def test_global_monitor_singleton(self):
        """Test that global monitor is a singleton"""
        from app.core.performance_monitor import performance_monitor as monitor2
        assert performance_monitor is monitor2 