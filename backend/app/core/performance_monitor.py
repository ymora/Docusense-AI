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

