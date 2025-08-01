"""
Service d'optimisation des formats pour maximiser l'utilisation des navigateurs
"""

import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import mimetypes

logger = logging.getLogger(__name__)


class FormatOptimizerService:
    """
    Service d'optimisation des formats pour décharger l'application
    en utilisant au maximum les capacités natives des navigateurs
    """

    # Formats natifs avec support excellent (95%+ des navigateurs)
    NATIVE_FORMATS = {
        'video': {
            'mp4': {
                'mime': 'video/mp4',
                'codecs': ['avc1.42E01E', 'avc1.4D401E', 'avc1.640028'],
                'priority': 1,
                'browser_support': 99.5
            },
            'webm': {
                'mime': 'video/webm',
                'codecs': ['vp8', 'vp9'],
                'priority': 2,
                'browser_support': 95.0
            },
            'ogg': {
                'mime': 'video/ogg',
                'codecs': ['theora'],
                'priority': 3,
                'browser_support': 85.0
            }
        },
        'audio': {
            'mp3': {
                'mime': 'audio/mpeg',
                'codecs': ['mp3'],
                'priority': 1,
                'browser_support': 99.5
            },
            'wav': {
                'mime': 'audio/wav',
                'codecs': ['pcm'],
                'priority': 2,
                'browser_support': 99.0
            },
            'aac': {
                'mime': 'audio/aac',
                'codecs': ['aac'],
                'priority': 3,
                'browser_support': 95.0
            },
            'm4a': {
                'mime': 'audio/mp4',
                'codecs': ['mp4a.40.2'],
                'priority': 4,
                'browser_support': 95.0
            }
        }
    }

    # Formats étendus avec support bon (70-90% des navigateurs)
    EXTENDED_FORMATS = {
        'video': {
            'mov': {'mime': 'video/quicktime', 'priority': 5, 'browser_support': 80.0},
            'avi': {'mime': 'video/x-msvideo', 'priority': 6, 'browser_support': 75.0},
            'wmv': {'mime': 'video/x-ms-wmv', 'priority': 7, 'browser_support': 70.0},
            'flv': {'mime': 'video/x-flv', 'priority': 8, 'browser_support': 65.0},
            '3gp': {'mime': 'video/3gpp', 'priority': 9, 'browser_support': 85.0},
            'ts': {'mime': 'video/mp2t', 'priority': 10, 'browser_support': 80.0},
            'm3u8': {'mime': 'application/x-mpegURL', 'priority': 11, 'browser_support': 85.0},
            'flac': {'mime': 'audio/flac', 'priority': 12, 'browser_support': 80.0},
            'opus': {'mime': 'audio/opus', 'priority': 13, 'browser_support': 85.0},
            'aiff': {'mime': 'audio/aiff', 'priority': 14, 'browser_support': 75.0},
            'wma': {'mime': 'audio/x-ms-wma', 'priority': 15, 'browser_support': 70.0},
            'amr': {'mime': 'audio/amr', 'priority': 16, 'browser_support': 80.0}
        }
    }

    # Formats avancés avec support limité (30-60% des navigateurs)
    ADVANCED_FORMATS = {
        'video': {
            'mkv': {'mime': 'video/x-matroska', 'priority': 17, 'browser_support': 50.0},
            'asf': {'mime': 'video/x-ms-asf', 'priority': 18, 'browser_support': 45.0},
            'rm': {'mime': 'video/x-pn-realvideo', 'priority': 19, 'browser_support': 40.0},
            'mpeg': {'mime': 'video/mpeg', 'priority': 20, 'browser_support': 55.0},
            'divx': {'mime': 'video/x-msvideo', 'priority': 21, 'browser_support': 35.0},
            'mxf': {'mime': 'application/mxf', 'priority': 22, 'browser_support': 30.0},
            'nut': {'mime': 'video/x-nut', 'priority': 23, 'browser_support': 25.0}
        },
        'audio': {
            'ra': {'mime': 'audio/x-pn-realaudio', 'priority': 24, 'browser_support': 40.0},
            'wv': {'mime': 'audio/x-wavpack', 'priority': 25, 'browser_support': 35.0},
            'ape': {'mime': 'audio/x-ape', 'priority': 26, 'browser_support': 30.0},
            'ac3': {'mime': 'audio/ac3', 'priority': 27, 'browser_support': 45.0},
            'dts': {'mime': 'audio/vnd.dts', 'priority': 28, 'browser_support': 35.0},
            'mka': {'mime': 'audio/x-matroska', 'priority': 29, 'browser_support': 40.0},
            'tta': {'mime': 'audio/x-tta', 'priority': 30, 'browser_support': 25.0}
        }
    }

    def __init__(self):
        """Initialise le service d'optimisation"""
        self.format_cache = {}
        self.optimization_stats = {
            'native_formats': 0,
            'extended_formats': 0,
            'advanced_formats': 0,
            'fallback_conversions': 0,
            'total_optimizations': 0
        }

    def optimize_format_for_browser(self, file_path: Path, original_mime: str) -> Dict[str, any]:
        """
        Optimise un format pour une meilleure compatibilité navigateur

        Args:
            file_path: Chemin du fichier
            original_mime: Type MIME original

        Returns:
            Dict: Informations d'optimisation
        """
        try:
            extension = file_path.suffix.lower().lstrip('.')
            media_type = self._get_media_type(original_mime)
            
            # Vérifier le cache
            cache_key = f"{extension}_{original_mime}"
            if cache_key in self.format_cache:
                return self.format_cache[cache_key]

            optimization_result = {
                'original_mime': original_mime,
                'optimized_mime': original_mime,
                'browser_support': 0.0,
                'priority': 999,
                'format_category': 'unknown',
                'recommended_action': 'use_as_is',
                'fallback_formats': [],
                'optimization_score': 0.0
            }

            # 1. Vérifier les formats natifs
            native_result = self._check_native_format(extension, original_mime, media_type)
            if native_result:
                optimization_result.update(native_result)
                optimization_result['format_category'] = 'native'
                optimization_result['recommended_action'] = 'use_native'
                self.optimization_stats['native_formats'] += 1
            else:
                # 2. Vérifier les formats étendus
                extended_result = self._check_extended_format(extension, original_mime, media_type)
                if extended_result:
                    optimization_result.update(extended_result)
                    optimization_result['format_category'] = 'extended'
                    optimization_result['recommended_action'] = 'use_extended'
                    self.optimization_stats['extended_formats'] += 1
                else:
                    # 3. Vérifier les formats avancés
                    advanced_result = self._check_advanced_format(extension, original_mime, media_type)
                    if advanced_result:
                        optimization_result.update(advanced_result)
                        optimization_result['format_category'] = 'advanced'
                        optimization_result['recommended_action'] = 'use_advanced'
                        self.optimization_stats['advanced_formats'] += 1
                    else:
                        # 4. Générer des fallbacks
                        fallbacks = self._generate_fallbacks(original_mime, media_type)
                        optimization_result['fallback_formats'] = fallbacks
                        optimization_result['recommended_action'] = 'convert_to_fallback'
                        self.optimization_stats['fallback_conversions'] += 1

            # Calculer le score d'optimisation
            optimization_result['optimization_score'] = self._calculate_optimization_score(optimization_result)
            
            # Mettre en cache
            self.format_cache[cache_key] = optimization_result
            self.optimization_stats['total_optimizations'] += 1

            logger.info(f"Optimisation format: {extension} → {optimization_result['optimized_mime']} "
                       f"(support: {optimization_result['browser_support']}%, "
                       f"action: {optimization_result['recommended_action']})")

            return optimization_result

        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation du format {file_path}: {str(e)}")
            return {
                'original_mime': original_mime,
                'optimized_mime': original_mime,
                'browser_support': 0.0,
                'priority': 999,
                'format_category': 'error',
                'recommended_action': 'use_as_is',
                'fallback_formats': [],
                'optimization_score': 0.0
            }

    def _get_media_type(self, mime_type: str) -> str:
        """Détermine le type de média (video/audio)"""
        if mime_type.startswith('video/'):
            return 'video'
        elif mime_type.startswith('audio/'):
            return 'audio'
        else:
            return 'unknown'

    def _check_native_format(self, extension: str, mime_type: str, media_type: str) -> Optional[Dict]:
        """Vérifie si le format est natif"""
        if media_type not in self.NATIVE_FORMATS:
            return None

        for format_info in self.NATIVE_FORMATS[media_type].values():
            if format_info['mime'] == mime_type:
                return {
                    'optimized_mime': mime_type,
                    'browser_support': format_info['browser_support'],
                    'priority': format_info['priority']
                }
        return None

    def _check_extended_format(self, extension: str, mime_type: str, media_type: str) -> Optional[Dict]:
        """Vérifie si le format est étendu"""
        if media_type not in self.EXTENDED_FORMATS:
            return None

        for format_info in self.EXTENDED_FORMATS[media_type].values():
            if format_info['mime'] == mime_type:
                return {
                    'optimized_mime': mime_type,
                    'browser_support': format_info['browser_support'],
                    'priority': format_info['priority']
                }
        return None

    def _check_advanced_format(self, extension: str, mime_type: str, media_type: str) -> Optional[Dict]:
        """Vérifie si le format est avancé"""
        if media_type not in self.ADVANCED_FORMATS:
            return None

        for format_info in self.ADVANCED_FORMATS[media_type].values():
            if format_info['mime'] == mime_type:
                return {
                    'optimized_mime': mime_type,
                    'browser_support': format_info['browser_support'],
                    'priority': format_info['priority']
                }
        return None

    def _generate_fallbacks(self, mime_type: str, media_type: str) -> List[str]:
        """Génère des formats de fallback"""
        fallbacks = []
        
        if media_type == 'video':
            # Fallbacks vidéo vers formats natifs
            fallbacks = [
                'video/mp4; codecs="avc1.42E01E"',
                'video/webm; codecs="vp8, vorbis"',
                'video/ogg; codecs="theora, vorbis"'
            ]
        elif media_type == 'audio':
            # Fallbacks audio vers formats natifs
            fallbacks = [
                'audio/mpeg',
                'audio/mp4; codecs="mp4a.40.2"',
                'audio/wav',
                'audio/ogg; codecs="vorbis"'
            ]
        
        return fallbacks

    def _calculate_optimization_score(self, result: Dict) -> float:
        """Calcule un score d'optimisation"""
        score = result['browser_support']
        
        # Bonus pour les formats natifs
        if result['format_category'] == 'native':
            score += 10
        elif result['format_category'] == 'extended':
            score += 5
        
        # Malus pour les formats avancés
        if result['format_category'] == 'advanced':
            score -= 10
        
        # Bonus pour les fallbacks disponibles
        if result['fallback_formats']:
            score += len(result['fallback_formats']) * 5
        
        return min(100.0, max(0.0, score))

    def get_optimization_stats(self) -> Dict:
        """Retourne les statistiques d'optimisation"""
        return self.optimization_stats.copy()

    def get_recommended_formats(self, media_type: str) -> List[Dict]:
        """Retourne les formats recommandés par priorité"""
        recommendations = []
        
        # Formats natifs en premier
        if media_type in self.NATIVE_FORMATS:
            for ext, info in self.NATIVE_FORMATS[media_type].items():
                recommendations.append({
                    'extension': ext,
                    'mime_type': info['mime'],
                    'priority': info['priority'],
                    'browser_support': info['browser_support'],
                    'category': 'native'
                })
        
        # Formats étendus
        if media_type in self.EXTENDED_FORMATS:
            for ext, info in self.EXTENDED_FORMATS[media_type].items():
                recommendations.append({
                    'extension': ext,
                    'mime_type': info['mime'],
                    'priority': info['priority'],
                    'browser_support': info['browser_support'],
                    'category': 'extended'
                })
        
        # Trier par priorité
        recommendations.sort(key=lambda x: x['priority'])
        
        return recommendations

    def clear_cache(self):
        """Vide le cache d'optimisation"""
        self.format_cache.clear()
        logger.info("Cache d'optimisation des formats vidé") 