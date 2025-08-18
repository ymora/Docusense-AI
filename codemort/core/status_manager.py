# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/status_manager.py
# Fonctions extraites: 20
# Lignes totales extraites: 252
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: get_status_color
# Lignes originales: 346-356
# =============================================================================

def get_status_color(status: str) -> str:
    """Obtient la couleur d'un statut (fonction standalone)"""
    colors = {
        "pending": "yellow",
        "processing": "blue", 
        "completed": "green",
        "failed": "red",
        "cancelled": "gray",
        "unsupported": "gray"
    }
    return colors.get(status, "black")


# =============================================================================
# FONCTION: get_status_label
# Lignes originales: 359-361
# =============================================================================

def get_status_label(status: str) -> str:
    """Obtient le label d'un statut (fonction standalone)"""
    return StatusManager.get_status_labels().get(status, "Inconnu")


# =============================================================================
# FONCTION: get_status_icon
# Lignes originales: 372-382
# =============================================================================

def get_status_icon(status: str) -> str:
    """Obtient l'icône d'un statut (fonction standalone)"""
    icons = {
        "pending": "⏳",
        "processing": "🔄",
        "completed": "✅",
        "failed": "❌",
        "cancelled": "⏹️",  # Icône correcte pour cancelled
        "unsupported": "❓"
    }
    return icons.get(status, "❓")


# =============================================================================
# FONCTION: format_status_message
# Lignes originales: 385-400
# =============================================================================

def format_status_message(status: str, details=None) -> str:
    """Formate un message de statut (fonction standalone)"""
    status_info = get_status_info(status)
    if status_info:
        if details:
            if isinstance(details, dict):
                return f"{status_info.icon} {status_info.label} {details}"
            return f"{status_info.icon} {status_info.label} {details}"
        else:
            return f"{status_info.icon} {status_info.label}"
    # Si statut inconnu, retourner juste le message ou message+details
    if details:
        if isinstance(details, dict):
            return f"{status} {details}"
        return f"{status} {details}"
    return status


# =============================================================================
# FONCTION: is_status_transition_valid
# Lignes originales: 403-425
# =============================================================================

def is_status_transition_valid(from_status: str, to_status: str) -> bool:
    """Vérifie si une transition de statut est valide (fonction standalone)"""
    # Si les deux statuts sont inconnus, retour False
    if from_status == to_status and from_status not in ["pending", "processing", "completed", "failed", "cancelled", "unsupported"]:
        return False
    # Autoriser les transitions vers soi-même et vers "cancelled"
    if from_status == to_status or to_status == "cancelled":
        return True
    
    # Transitions valides spécifiques
    valid_transitions = {
        "pending": ["processing", "failed", "cancelled"],
        "processing": ["completed", "failed", "cancelled"],
        "completed": ["cancelled"],
        "failed": ["pending", "cancelled"],
        "unsupported": ["cancelled"]
    }
    
    if from_status in valid_transitions:
        return to_status in valid_transitions[from_status]
    
    # Pour les statuts inconnus, pas de transition valide
    return False


# =============================================================================
# FONCTION: _status_manager_init
# Lignes originales: 429-431
# =============================================================================

def _status_manager_init(self):
    """Initialisation avec historique"""
    self.status_history = {}


# =============================================================================
# FONCTION: update_status
# Lignes originales: 434-438
# =============================================================================

def update_status(self, file_id: str, status: str, details: str = ""):
    """Met à jour le statut d'un fichier"""
    if file_id not in self.status_history:
        self.status_history[file_id] = []
    self.status_history[file_id].append({"status": status, "message": details})


# =============================================================================
# FONCTION: get_current_status
# Lignes originales: 441-445
# =============================================================================

def get_current_status(self, file_id: str):
    """Obtient le statut actuel d'un fichier"""
    if file_id in self.status_history and self.status_history[file_id]:
        return self.status_history[file_id][-1]  # Retourner l'objet complet
    return None


# =============================================================================
# FONCTION: get_status_history
# Lignes originales: 448-450
# =============================================================================

def get_status_history(self, file_id: str):
    """Obtient l'historique des statuts d'un fichier"""
    return self.status_history.get(file_id, [])


# =============================================================================
# FONCTION: clear_history
# Lignes originales: 453-456
# =============================================================================

def clear_history(self, file_id: str):
    """Efface l'historique d'un fichier"""
    if file_id in self.status_history:
        del self.status_history[file_id]


# =============================================================================
# FONCTION: clear_all_history
# Lignes originales: 459-461
# =============================================================================

def clear_all_history(self):
    """Efface tout l'historique"""
    self.status_history.clear()


# =============================================================================
# FONCTION: get_all_statuses
# Lignes originales: 114-121
# =============================================================================

    def get_all_statuses(cls) -> List[FileStatus]:
        """
        Obtient tous les statuts disponibles

        Returns:
            List[FileStatus]: Liste des statuts
        """
        return list(FileStatus)


# =============================================================================
# FONCTION: get_status_colors
# Lignes originales: 135-143
# =============================================================================

    def get_status_colors(cls) -> Dict[str, str]:
        """
        Obtient les couleurs de tous les statuts

        Returns:
            Dict[str, str]: Dictionnaire valeur -> couleur
        """
        return {
            status.value: cls.STATUS_CONFIG[status].color for status in FileStatus}


# =============================================================================
# FONCTION: can_analyze_file
# Lignes originales: 146-157
# =============================================================================

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


# =============================================================================
# FONCTION: can_retry_file
# Lignes originales: 160-171
# =============================================================================

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


# =============================================================================
# FONCTION: get_status_summary
# Lignes originales: 174-195
# =============================================================================

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


# =============================================================================
# FONCTION: get_allowed_transitions
# Lignes originales: 230-241
# =============================================================================

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


# =============================================================================
# FONCTION: validate_transition
# Lignes originales: 244-269
# =============================================================================

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


# =============================================================================
# FONCTION: analyze_status_distribution
# Lignes originales: 278-322
# =============================================================================

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


# =============================================================================
# FONCTION: get_status_priority
# Lignes originales: 325-343
# =============================================================================

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

