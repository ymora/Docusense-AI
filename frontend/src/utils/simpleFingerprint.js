/**
 * Collecteur d'empreinte simple et conforme RGPD
 * Inspiré des approches de GitHub, GitLab, Vercel
 * Collecte UNIQUEMENT les données nécessaires
 */

export class SimpleFingerprint {
    /**
     * Génère une empreinte simple basée sur des données non-sensibles
     * Conforme RGPD - pas de données personnelles
     */
    static async generate() {
        const data = {
            // Données de base du navigateur (non-sensibles)
            user_agent: navigator.userAgent,
            language: navigator.language || 'unknown',
            platform: navigator.platform || 'unknown',
            
            // Résolution d'écran (publique)
            screen_width: screen.width,
            screen_height: screen.height,
            
            // Timezone (publique)
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // Timestamp pour éviter la mise en cache
            timestamp: new Date().toISOString()
        };

        return {
            data: data,
            hash: await this.generateHash(data)
        };
    }

    /**
     * Génère un hash simple de l'empreinte
     */
    static async generateHash(data) {
        const dataString = JSON.stringify(data, Object.keys(data).sort());
        
        // Utiliser SubtleCrypto si disponible
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(dataString);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
        } else {
            // Fallback simple
            let hash = 0;
            for (let i = 0; i < dataString.length; i++) {
                const char = dataString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(16).substring(0, 32);
        }
    }
}

// Fonction utilitaire
export async function generateSimpleFingerprint() {
    return await SimpleFingerprint.generate();
}

export default SimpleFingerprint;
