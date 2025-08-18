# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/performance_monitor.py
# Fonctions extraites: 5
# Lignes totales extraites: 97
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: monitor_performance
# Lignes originales: 75-99
# =============================================================================

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


# =============================================================================
# FONCTION: log_performance_summary
# Lignes originales: 102-119
# =============================================================================

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


# =============================================================================
# FONCTION: get_average
# Lignes originales: 33-45
# =============================================================================

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


# =============================================================================
# FONCTION: decorator
# Lignes originales: 77-98
# =============================================================================

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


# =============================================================================
# FONCTION: wrapper
# Lignes originales: 79-97
# =============================================================================

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

