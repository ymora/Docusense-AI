"""
Gestionnaire centralisé des statuts de fichiers
"""

import logging
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class FileStatus(Enum):
    """
    Statuts possibles pour les fichiers
    """
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    UNSUPPORTED = "unsupported"


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
            icon="✅",
            description="Analyse terminée avec succès",
            can_analyze=True,
            can_retry=False
        ),
        FileStatus.FAILED: StatusInfo(
            value="failed",
            label="Échec",
            color="red",
            icon="❌",
            description="Échec de l'analyse",
            can_analyze=True,
            can_retry=True
        ),
        FileStatus.UNSUPPORTED: StatusInfo(
            value="unsupported",
            label="Non supporté",
            color="gray",
            icon="🚫",
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
        """
        Obtient un statut par sa valeur

        Args:
            value: Valeur du statut

        Returns:
            FileStatus: Statut correspondant
        """
        for status in FileStatus:
            if status.value == value:
                return status
        return None

    @classmethod
    def get_all_statuses(cls) -> List[FileStatus]:
        """
        Obtient tous les statuts disponibles

        Returns:
            List[FileStatus]: Liste des statuts
        """
        return list(FileStatus)

    @classmethod
    def get_status_labels(cls) -> Dict[str, str]:
        """
        Obtient les labels de tous les statuts

        Returns:
            Dict[str, str]: Dictionnaire valeur -> label
        """
        return {
            status.value: cls.STATUS_CONFIG[status].label for status in FileStatus}

    @classmethod
    def get_status_colors(cls) -> Dict[str, str]:
        """
        Obtient les couleurs de tous les statuts

        Returns:
            Dict[str, str]: Dictionnaire valeur -> couleur
        """
        return {
            status.value: cls.STATUS_CONFIG[status].color for status in FileStatus}

    @classmethod
    def can_analyze_file(cls, status: FileStatus) -> bool:
        """
        Vérifie si un fichier peut être analysé selon son statut

        Args:
            status: Statut du fichier

        Returns:
            bool: True si le fichier peut être analysé
        """
        status_info = cls.get_status_info(status)
        return status_info.can_analyze if status_info else False

    @classmethod
    def can_retry_file(cls, status: FileStatus) -> bool:
        """
        Vérifie si un fichier peut être relancé selon son statut

        Args:
            status: Statut du fichier

        Returns:
            bool: True si le fichier peut être relancé
        """
        status_info = cls.get_status_info(status)
        return status_info.can_retry if status_info else False

    @classmethod
    def get_status_summary(cls) -> Dict[str, Any]:
        """
        Obtient un résumé de tous les statuts

        Returns:
            Dict: Résumé des statuts
        """
        summary = {}

        for status in FileStatus:
            status_info = cls.get_status_info(status)
            if status_info:
                summary[status.value] = {
                    "label": status_info.label,
                    "color": status_info.color,
                    "icon": status_info.icon,
                    "description": status_info.description,
                    "can_analyze": status_info.can_analyze,
                    "can_retry": status_info.can_retry
                }

        return summary


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

    @classmethod
    def get_allowed_transitions(
            cls, current_status: FileStatus) -> List[FileStatus]:
        """
        Obtient les transitions autorisées depuis un statut

        Args:
            current_status: Statut actuel

        Returns:
            List[FileStatus]: Liste des statuts autorisés
        """
        return cls.ALLOWED_TRANSITIONS.get(current_status, [])

    @classmethod
    def validate_transition(
            cls,
            from_status: FileStatus,
            to_status: FileStatus) -> bool:
        """
        Valide une transition de statut

        Args:
            from_status: Statut de départ
            to_status: Statut de destination

        Returns:
            bool: True si la transition est valide
        """
        if not cls.can_transition_to(from_status, to_status):
            logger.warning(
                f"Transition non autorisée: {
                    from_status.value} → {
                    to_status.value}")
            return False

        logger.info(
            f"Transition autorisée: {
                from_status.value} → {
                to_status.value}")
        return True


class StatusAnalyzer:
    """
    Analyseur de statuts pour les métriques
    """

    @staticmethod
    def analyze_status_distribution(
            status_counts: Dict[str, int]) -> Dict[str, Any]:
        """
        Analyse la distribution des statuts

        Args:
            status_counts: Nombre de fichiers par statut

        Returns:
            Dict: Analyse de la distribution
        """
        total_files = sum(status_counts.values())

        if total_files == 0:
            return {
                "total": 0,
                "distribution": {},
                "percentages": {},
                "summary": "Aucun fichier"
            }

        # Calculer les pourcentages
        percentages = {}
        for status, count in status_counts.items():
            percentages[status] = round((count / total_files) * 100, 2)

        # Générer un résumé
        summary_parts = []
        for status, count in status_counts.items():
            if count > 0:
                status_info = StatusManager.get_status_info(
                    StatusManager.get_status_by_value(status))
                if status_info:
                    summary_parts.append(
                        f"{count} {status_info.label.lower()}")

        summary = ", ".join(
            summary_parts) if summary_parts else "Aucun fichier"

        return {
            "total": total_files,
            "distribution": status_counts,
            "percentages": percentages,
            "summary": summary
        }

    @staticmethod
    def get_status_priority(status: FileStatus) -> int:
        """
        Obtient la priorité d'un statut pour l'affichage

        Args:
            status: Statut du fichier

        Returns:
            int: Priorité (plus petit = plus prioritaire)
        """
        priority_map = {
            FileStatus.PROCESSING: 1,  # En cours en premier
            FileStatus.FAILED: 2,      # Échecs ensuite
            FileStatus.PENDING: 3,     # En attente
            FileStatus.COMPLETED: 4,   # Terminés
            FileStatus.UNSUPPORTED: 5  # Non supportés en dernier
        }

        return priority_map.get(status, 999)
