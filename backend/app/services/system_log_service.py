"""
System logging service for security monitoring and audit trail
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from fastapi import Request
import json
import re
from collections import defaultdict

from app.core.database import get_db
from app.models.system_log import SystemLog, LogLevel, SystemLogCreate, SecurityEventSummary
from app.models.user import User
from app.core.logging import get_logger
from app.services.base_service import BaseService


class SystemLogService(BaseService):
    """Service for managing system logs and security monitoring"""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.suspicious_patterns = self._init_suspicious_patterns()
    
    def _init_suspicious_patterns(self) -> Dict[str, Any]:
        """Initialize patterns for detecting suspicious activity"""
        return {
            'failed_login_threshold': 5,  # Max failed logins per IP in 1 hour
            'request_rate_threshold': 100,  # Max requests per IP in 1 minute
            'suspicious_user_agents': [
                r'.*bot.*', r'.*crawler.*', r'.*spider.*', r'.*scraper.*'
            ],
            'suspicious_paths': [
                r'.*\.php$', r'.*\.asp$', r'.*admin.*', r'.*config.*', r'.*\.env.*'
            ],
            'security_actions': [
                'failed_login', 'unauthorized_access', 'permission_denied',
                'invalid_token', 'suspicious_request', 'role_escalation'
            ]
        }
    
    def log_event(
        self,
        level: LogLevel,
        source: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request: Optional[Request] = None
    ) -> SystemLog:
        """Log a system event"""
        try:
            # Extract info from request if provided
            if request:
                ip_address = ip_address or self._get_client_ip(request)
                user_agent = user_agent or request.headers.get("User-Agent", "")
                
                # Add request details to details dict
                if details is None:
                    details = {}
                details.update({
                    'method': request.method,
                    'url': str(request.url),
                    'headers': dict(request.headers)
                })
            
            # Detect if this is a security event
            is_security_event = self._is_security_event(action, details, level)
            is_suspicious = self._is_suspicious_activity(
                action, ip_address, user_agent, details
            )
            
            # Create log entry
            log_data = SystemLogCreate(
                level=level,
                source=source,
                action=action,
                details=details,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                is_security_event=is_security_event,
                is_suspicious=is_suspicious
            )
            
            log_entry = SystemLog(**log_data.dict())
            self.db.add(log_entry)
            self.db.commit()
            self.db.refresh(log_entry)
            
            # Log to file for immediate visibility
            self.logger.info(f"System log: {level.value} - {source} - {action}")
            
            # If it's a security event, also log with higher priority
            if is_security_event or is_suspicious:
                self.logger.warning(f"SECURITY EVENT: {action} from {ip_address} - Details: {details}")
            
            return log_entry
            
        except Exception as e:
            self.logger.error(f"Failed to log system event: {str(e)}")
            # Don't raise exception to avoid breaking the main flow
            return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies"""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _is_security_event(
        self, 
        action: str, 
        details: Optional[Dict[str, Any]], 
        level: LogLevel
    ) -> bool:
        """Determine if an event is security-related"""
        if level == LogLevel.SECURITY:
            return True
        
        security_keywords = [
            'login', 'auth', 'permission', 'access', 'token', 
            'admin', 'unauthorized', 'forbidden', 'failed'
        ]
        
        action_lower = action.lower()
        return any(keyword in action_lower for keyword in security_keywords)
    
    def _is_suspicious_activity(
        self,
        action: str,
        ip_address: Optional[str],
        user_agent: Optional[str],
        details: Optional[Dict[str, Any]]
    ) -> bool:
        """Detect suspicious activity patterns"""
        if not ip_address:
            return False
        
        # Check suspicious user agents
        if user_agent:
            for pattern in self.suspicious_patterns['suspicious_user_agents']:
                if re.match(pattern, user_agent.lower()):
                    return True
        
        # Check request rate (simplified check)
        if self._check_rate_limit_exceeded(ip_address):
            return True
        
        # Check for suspicious paths in details
        if details and 'url' in details:
            url = details['url'].lower()
            for pattern in self.suspicious_patterns['suspicious_paths']:
                if re.match(pattern, url):
                    return True
        
        return False
    
    def _check_rate_limit_exceeded(self, ip_address: str) -> bool:
        """Check if IP has exceeded rate limit (simplified)"""
        try:
            # Count requests from this IP in the last minute
            one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
            
            count = self.db.query(func.count(SystemLog.id)).filter(
                and_(
                    SystemLog.ip_address == ip_address,
                    SystemLog.timestamp >= one_minute_ago
                )
            ).scalar()
            
            return count > self.suspicious_patterns['request_rate_threshold']
            
        except Exception as e:
            self.logger.error(f"Error checking rate limit: {str(e)}")
            return False
    
    def get_security_events(
        self, 
        hours: int = 24,
        limit: int = 100,
        offset: int = 0
    ) -> List[SystemLog]:
        """Get recent security events"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        return self.db.query(SystemLog).filter(
            and_(
                SystemLog.is_security_event == True,
                SystemLog.timestamp >= since
            )
        ).order_by(desc(SystemLog.timestamp)).limit(limit).offset(offset).all()
    
    def get_suspicious_activities(
        self,
        hours: int = 24,
        limit: int = 100,
        offset: int = 0
    ) -> List[SystemLog]:
        """Get recent suspicious activities"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        return self.db.query(SystemLog).filter(
            and_(
                SystemLog.is_suspicious == True,
                SystemLog.timestamp >= since
            )
        ).order_by(desc(SystemLog.timestamp)).limit(limit).offset(offset).all()
    
    def get_failed_login_attempts(
        self,
        hours: int = 24,
        ip_address: Optional[str] = None
    ) -> List[SystemLog]:
        """Get failed login attempts"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        query = self.db.query(SystemLog).filter(
            and_(
                SystemLog.action.like('%failed_login%'),
                SystemLog.timestamp >= since
            )
        )
        
        if ip_address:
            query = query.filter(SystemLog.ip_address == ip_address)
        
        return query.order_by(desc(SystemLog.timestamp)).all()
    
    def get_security_summary(self, hours: int = 24) -> SecurityEventSummary:
        """Get summary of security events"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # Count different types of security events
        failed_logins = self.db.query(func.count(SystemLog.id)).filter(
            and_(
                SystemLog.action.like('%failed_login%'),
                SystemLog.timestamp >= since
            )
        ).scalar()
        
        unauthorized_access = self.db.query(func.count(SystemLog.id)).filter(
            and_(
                SystemLog.action.like('%unauthorized%'),
                SystemLog.timestamp >= since
            )
        ).scalar()
        
        suspicious_activity = self.db.query(func.count(SystemLog.id)).filter(
            and_(
                SystemLog.is_suspicious == True,
                SystemLog.timestamp >= since
            )
        ).scalar()
        
        total_events = self.db.query(func.count(SystemLog.id)).filter(
            and_(
                SystemLog.is_security_event == True,
                SystemLog.timestamp >= since
            )
        ).scalar()
        
        return SecurityEventSummary(
            failed_logins=failed_logins or 0,
            unauthorized_access=unauthorized_access or 0,
            suspicious_activity=suspicious_activity or 0,
            total_events=total_events or 0,
            time_period=f"{hours}h"
        )
    
    def cleanup_old_logs(self, days: int = 30) -> int:
        """Clean up logs older than specified days"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Keep security events longer (90 days)
            security_cutoff = datetime.utcnow() - timedelta(days=90)
            
            # Delete non-security logs older than cutoff
            deleted_regular = self.db.query(SystemLog).filter(
                and_(
                    SystemLog.timestamp < cutoff_date,
                    SystemLog.is_security_event == False
                )
            ).delete()
            
            # Delete old security events
            deleted_security = self.db.query(SystemLog).filter(
                and_(
                    SystemLog.timestamp < security_cutoff,
                    SystemLog.is_security_event == True
                )
            ).delete()
            
            self.db.commit()
            
            total_deleted = deleted_regular + deleted_security
            self.logger.info(f"Cleaned up {total_deleted} old log entries")
            
            return total_deleted
            
        except Exception as e:
            self.logger.error(f"Error cleaning up logs: {str(e)}")
            self.db.rollback()
            return 0
    
    def get_ip_activity_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get summary of activity by IP address"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # Get top IPs by request count
        ip_counts = self.db.query(
            SystemLog.ip_address,
            func.count(SystemLog.id).label('request_count'),
            func.count(
                func.nullif(SystemLog.is_security_event, False)
            ).label('security_events'),
            func.count(
                func.nullif(SystemLog.is_suspicious, False)
            ).label('suspicious_activities')
        ).filter(
            and_(
                SystemLog.timestamp >= since,
                SystemLog.ip_address.isnot(None)
            )
        ).group_by(SystemLog.ip_address).order_by(
            desc('request_count')
        ).limit(20).all()
        
        return {
            'time_period': f"{hours}h",
            'ip_activity': [
                {
                    'ip_address': ip,
                    'request_count': count,
                    'security_events': sec_events or 0,
                    'suspicious_activities': sus_activities or 0
                }
                for ip, count, sec_events, sus_activities in ip_counts
            ]
        }
