"""
System logs API endpoints - Admin only access
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.system_log import (
    SystemLog, SystemLogResponse, SystemLogListResponse, 
    SecurityEventSummary, LogLevel
)
from app.models.user import User
from app.services.system_log_service import SystemLogService
from app.middleware.auth_middleware import get_current_user, require_admin
from app.core.logging import get_logger

router = APIRouter(prefix="/api/system-logs", tags=["System Logs"])
logger = get_logger(__name__)


@router.get("/", response_model=SystemLogListResponse)
async def get_system_logs(
    level: Optional[LogLevel] = Query(None, description="Filter by log level"),
    source: Optional[str] = Query(None, description="Filter by source component"),
    hours: int = Query(24, description="Hours to look back", ge=1, le=168),  # Max 1 week
    limit: int = Query(100, description="Number of logs to return", ge=1, le=1000),
    offset: int = Query(0, description="Number of logs to skip", ge=0),
    security_only: bool = Query(False, description="Show only security events"),
    suspicious_only: bool = Query(False, description="Show only suspicious activities"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get system logs - Admin only"""
    try:
        log_service = SystemLogService(db)
        
        # Log the admin access
        log_service.log_event(
            level=LogLevel.INFO,
            source="system_logs_api",
            action="admin_logs_access",
            details={
                'filters': {
                    'level': level.value if level else None,
                    'source': source,
                    'hours': hours,
                    'security_only': security_only,
                    'suspicious_only': suspicious_only
                }
            },
            user_id=current_user.id
        )
        
        # Build query
        from sqlalchemy import and_, desc
        from datetime import timedelta
        
        since = datetime.utcnow() - timedelta(hours=hours)
        query = db.query(SystemLog).filter(SystemLog.timestamp >= since)
        
        # Apply filters
        if level:
            query = query.filter(SystemLog.level == level)
        
        if source:
            query = query.filter(SystemLog.source == source)
        
        if security_only:
            query = query.filter(SystemLog.is_security_event == True)
        
        if suspicious_only:
            query = query.filter(SystemLog.is_suspicious == True)
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        logs = query.order_by(desc(SystemLog.timestamp)).limit(limit).offset(offset).all()
        
        return SystemLogListResponse(
            logs=[SystemLogResponse.from_orm(log) for log in logs],
            total=total,
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        logger.error(f"Error retrieving system logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving system logs")


@router.get("/security-summary", response_model=SecurityEventSummary)
async def get_security_summary(
    hours: int = Query(24, description="Hours to look back", ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get security events summary - Admin only"""
    try:
        log_service = SystemLogService(db)
        
        # Log the admin access
        log_service.log_event(
            level=LogLevel.INFO,
            source="system_logs_api",
            action="admin_security_summary_access",
            details={'hours': hours},
            user_id=current_user.id
        )
        
        return log_service.get_security_summary(hours=hours)
        
    except Exception as e:
        logger.error(f"Error retrieving security summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving security summary")


@router.get("/ip-activity")
async def get_ip_activity(
    hours: int = Query(24, description="Hours to look back", ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get IP activity summary - Admin only"""
    try:
        log_service = SystemLogService(db)
        
        # Log the admin access
        log_service.log_event(
            level=LogLevel.INFO,
            source="system_logs_api",
            action="admin_ip_activity_access",
            details={'hours': hours},
            user_id=current_user.id
        )
        
        return log_service.get_ip_activity_summary(hours=hours)
        
    except Exception as e:
        logger.error(f"Error retrieving IP activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving IP activity")


@router.get("/failed-logins")
async def get_failed_logins(
    hours: int = Query(24, description="Hours to look back", ge=1, le=168),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get failed login attempts - Admin only"""
    try:
        log_service = SystemLogService(db)
        
        # Log the admin access
        log_service.log_event(
            level=LogLevel.INFO,
            source="system_logs_api",
            action="admin_failed_logins_access",
            details={'hours': hours, 'ip_filter': ip_address},
            user_id=current_user.id
        )
        
        failed_logins = log_service.get_failed_login_attempts(
            hours=hours, 
            ip_address=ip_address
        )
        
        return {
            'failed_logins': [
                {
                    'timestamp': log.timestamp,
                    'ip_address': log.ip_address,
                    'user_agent': log.user_agent,
                    'details': log.details
                }
                for log in failed_logins
            ],
            'total': len(failed_logins),
            'time_period': f"{hours}h"
        }
        
    except Exception as e:
        logger.error(f"Error retrieving failed logins: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving failed logins")


@router.delete("/cleanup")
async def cleanup_old_logs(
    days: int = Query(30, description="Delete logs older than X days", ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Clean up old logs - Admin only"""
    try:
        log_service = SystemLogService(db)
        
        # Log the cleanup action
        log_service.log_event(
            level=LogLevel.INFO,
            source="system_logs_api",
            action="admin_logs_cleanup",
            details={'days_threshold': days},
            user_id=current_user.id,
            request=request
        )
        
        deleted_count = log_service.cleanup_old_logs(days=days)
        
        return {
            'success': True,
            'deleted_count': deleted_count,
            'days_threshold': days,
            'message': f"Successfully deleted {deleted_count} old log entries"
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Error cleaning up logs")


@router.get("/sources")
async def get_log_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get list of log sources - Admin only"""
    try:
        from sqlalchemy import distinct
        
        sources = db.query(distinct(SystemLog.source)).all()
        source_list = [source[0] for source in sources if source[0]]
        
        return {
            'sources': sorted(source_list),
            'count': len(source_list)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving log sources: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving log sources")


@router.post("/manual-event")
async def create_manual_log_event(
    level: LogLevel,
    action: str,
    details: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    request: Request = None
):
    """Create a manual log event - Admin only (for testing or manual logging)"""
    try:
        log_service = SystemLogService(db)
        
        # Create the manual event
        log_entry = log_service.log_event(
            level=level,
            source="manual_admin",
            action=action,
            details=details or {},
            user_id=current_user.id,
            request=request
        )
        
        return {
            'success': True,
            'log_id': log_entry.id if log_entry else None,
            'message': 'Manual log event created successfully'
        }
        
    except Exception as e:
        logger.error(f"Error creating manual log event: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating manual log event")
