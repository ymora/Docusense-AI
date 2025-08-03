import json
import asyncio
from typing import Optional
from sqlalchemy.orm import Session
import time
from threading import Lock
from datetime import datetime

from ..models.analysis import AnalysisType
from ..models.config import Config

from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, AIProviderConfig