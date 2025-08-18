"""
Response formatter utilities for DocuSense AI
"""

from typing import Dict, Any, Optional
from datetime import datetime


class ResponseFormatter:
    """Utility class for formatting API responses"""
    
    @staticmethod
    def success_response(data: Any = None, message: str = "Success", **kwargs) -> Dict[str, Any]:
        """Format a successful response"""
        response = {
            "success": True,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        }
        
        if data is not None:
            response["data"] = data
            
        return response
    
    @staticmethod
    def error_response(message: str = "Error", error_code: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Format an error response"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        }
        
        if error_code:
            response["error_code"] = error_code
            
        return response
