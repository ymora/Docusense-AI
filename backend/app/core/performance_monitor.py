"""
Performance monitoring for DocuSense AI
"""

import time
import logging
from functools import wraps
from typing import Dict, Any, Optional
from collections import defaultdict
import psutil
import threading

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Monitor application performance metrics"""
    
    def __init__(self):
        self.metrics = defaultdict(list)
        self.start_time = time.time()
        self.lock = threading.Lock()
    
    def record_metric(self, metric_name: str, value: float, tags: Optional[Dict[str, str]] = None):
        """Record a performance metric"""
        with self.lock:
            self.metrics[metric_name].append({
                'value': value,
                'timestamp': time.time(),
                'tags': tags or {}
            })
    
    def get_average(self, metric_name: str, window_seconds: int = 300) -> float:
        """Get average value for a metric over a time window"""
        with self.lock:
            if metric_name not in self.metrics:
                return 0.0
            
            cutoff_time = time.time() - window_seconds
            recent_values = [
                m['value'] for m in self.metrics[metric_name]
                if m['timestamp'] > cutoff_time
            ]
            
            return sum(recent_values) / len(recent_values) if recent_values else 0.0
    
    def get_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        with self.lock:
            summary = {
                'uptime_seconds': time.time() - self.start_time,
                'system_memory_mb': psutil.virtual_memory().used / 1024 / 1024,
                'system_cpu_percent': psutil.cpu_percent(),
                'metrics': {}
            }
            
            for metric_name, values in self.metrics.items():
                if values:
                    recent_values = [v['value'] for v in values[-100:]]  # Last 100 values
                    summary['metrics'][metric_name] = {
                        'count': len(values),
                        'average': sum(recent_values) / len(recent_values),
                        'min': min(recent_values),
                        'max': max(recent_values),
                        'last_value': values[-1]['value']
                    }
            
            return summary


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def monitor_performance(metric_name: str, tags: Optional[Dict[str, str]] = None):
    """Decorator to monitor function performance"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                performance_monitor.record_metric(
                    f"{metric_name}_success", 
                    execution_time, 
                    tags
                )
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                performance_monitor.record_metric(
                    f"{metric_name}_error", 
                    execution_time, 
                    tags
                )
                raise
        return wrapper
    return decorator


def log_performance_summary():
    """Log current performance summary"""
    summary = performance_monitor.get_summary()
    
    logger.info("=== PERFORMANCE SUMMARY ===")
    logger.info(f"Uptime: {summary['uptime_seconds']:.1f} seconds")
    logger.info(f"Memory: {summary['system_memory_mb']:.1f} MB")
    logger.info(f"CPU: {summary['system_cpu_percent']:.1f}%")
    
    for metric_name, stats in summary['metrics'].items():
        logger.info(f"{metric_name}:")
        logger.info(f"  Count: {stats['count']}")
        logger.info(f"  Average: {stats['average']:.3f}s")
        logger.info(f"  Min: {stats['min']:.3f}s")
        logger.info(f"  Max: {stats['max']:.3f}s")
        logger.info(f"  Last: {stats['last_value']:.3f}s")
    
    logger.info("===========================") 