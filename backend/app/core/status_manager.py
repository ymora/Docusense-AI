"""
Gestionnaire centralisé des statuts de fichiers
"""

import logging
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


from ..models.file import FileStatus


@dataclass
class StatusInfo:
    """
    Informations sur un statut
    """
    value: str
    label: str
    color: str
    icon: str
    description: str
    can_analyze: bool
    can_retry: bool


class StatusManager:
    """
    Gestionnaire centralisé des statuts de fichiers
    """

    # Configuration centralisée des statuts
    STATUS_CONFIG = {
        FileStatus.PENDING: StatusInfo(
            value="pending",
            label="En attente",
            color="yellow",
            icon="⏳",
            description="Fichier en attente d'analyse",
            can_analyze=True,
            can_retry=False
        ),
        FileStatus.PROCESSING: StatusInfo(
            value="processing",
            label="En cours",
            color="blue",
            icon="🔄",
            description="Fichier en cours d'analyse",
            can_analyze=False,
            can_retry=False
        ),
        FileStatus.COMPLETED: StatusInfo(
            value="completed",
            label="Terminé",
            color="green",
            icon="[SUCCESS]",
            description="Analyse terminée avec succès",
            can_analyze=True,
            can_retry=False
        ),
        FileStatus.FAILED: StatusInfo(
            value="failed",
            label="Échec",
            color="red",
            icon="[ERROR]",
            description="Échec de l'analyse",
            can_analyze=True,
            can_retry=True
        ),
        FileStatus.UNSUPPORTED: StatusInfo(
            value="unsupported",
            label="Non supporté",
            color="gray",
            icon="[BLOCKED]",
            description="Format de fichier non supporté",
            can_analyze=False,
            can_retry=False
        )
    }

    @classmethod
    def get_status_info(cls, status: FileStatus) -> Optional[StatusInfo]:
        """
        Obtient les informations d'un statut

        Args:
            status: Statut du fichier

        Returns:
            StatusInfo: Informations du statut
        """
        return cls.STATUS_CONFIG.get(status)

    @classmethod
    def get_status_by_value(cls, value: str) -> Optional[FileStatus]:
        """Obtient un statut par sa valeur"""
        for status in FileStatus:
            if status.value == value:
                return status
        return None

    @classmethod
    def get_all_statuses(cls) -> List[FileStatus]:
        """Obtient tous les statuts disponibles"""
        return list(FileStatus)

    @classmethod
    def get_analyzeable_statuses(cls) -> List[FileStatus]:
        """Obtient les statuts qui peuvent être analysés"""
        return [status for status in FileStatus if cls.STATUS_CONFIG[status].can_analyze]

    @classmethod
    def get_retryable_statuses(cls) -> List[FileStatus]:
        """Obtient les statuts qui peuvent être retentés"""
        return [status for status in FileStatus if cls.STATUS_CONFIG[status].can_retry]

    @classmethod
    def get_status_labels(cls) -> Dict[str, str]:
        """
        Obtient les labels de tous les statuts

        Returns:
            Dict[str, str]: Dictionnaire valeur -> label
        """
        return {
            status.value: cls.STATUS_CONFIG[status].label for status in FileStatus}


class StatusTransitionManager:
    """
    Gestionnaire des transitions de statuts
    """

    # Transitions autorisées
    ALLOWED_TRANSITIONS = {
        FileStatus.PENDING: [FileStatus.PROCESSING, FileStatus.FAILED],
        FileStatus.PROCESSING: [FileStatus.COMPLETED, FileStatus.FAILED],
        FileStatus.COMPLETED: [FileStatus.PROCESSING],  # Pour re-analyse
        # Pour retry
        FileStatus.FAILED: [FileStatus.PENDING, FileStatus.PROCESSING],
        FileStatus.UNSUPPORTED: []  # Pas de transition possible
    }

    @classmethod
    def can_transition_to(cls, from_status: FileStatus,
                          to_status: FileStatus) -> bool:
        """
        Vérifie si une transition de statut est autorisée

        Args:
            from_status: Statut de départ
            to_status: Statut de destination

        Returns:
            bool: True si la transition est autorisée
        """
        allowed_transitions = cls.ALLOWED_TRANSITIONS.get(from_status, [])
        return to_status in allowed_transitions


class StatusAnalyzer:
    """
    Analyseur de statuts pour les métriques
    """

    @staticmethod
    def analyze_status(status: FileStatus) -> Dict[str, Any]:
        """Analyse un statut pour extraire les métriques"""
        status_info = StatusManager.get_status_info(status)
        if not status_info:
            return {}

        metrics = {
            "value": status.value,
            "label": status_info.label,
            "color": status_info.color,
            "icon": status_info.icon,
            "description": status_info.description,
            "can_analyze": status_info.can_analyze,
            "can_retry": status_info.can_retry
        }
        return metrics

    @staticmethod
    def get_status_statistics(statuses: List[FileStatus]) -> Dict[str, int]:
        """Calcule les statistiques des statuts"""
        stats = {}
        for status in FileStatus:
            stats[status.value] = statuses.count(status)
        return stats


# Fonctions standalone pour la compatibilité




def get_status_info(status: str) -> Optional[StatusInfo]:
    """Obtient les informations d'un statut (fonction standalone)"""
    file_status = StatusManager.get_status_by_value(status)
    if file_status:
        return StatusManager.get_status_info(file_status)
    return None
