# Implémentation de la Détection d'Inactivité et Reconnexion Manuelle

## Problème Résolu

Le backend envoyait des requêtes continues même quand le frontend était inactif, causant une utilisation inutile des ressources.

## Solution Implémentée

### 1. Détection d'Inactivité Intelligente

**Fichier modifié**: `frontend/src/hooks/useBackendStatus.ts`

- **Timeout**: 1 minute d'inactivité
- **Événements surveillés**: mousedown, mousemove, keypress, scroll, touchstart, click
- **Logique**: L'état inactif ne se déclenche que si le backend est déconnecté ET que l'utilisateur est inactif
- **Nouveaux états**:
  - `isInactive`: Indique si le frontend est inactif
  - `isMonitoring`: Contrôle si la surveillance périodique est active

### 2. Indicateur Visuel Amélioré

**Fichier modifié**: `frontend/src/components/Layout/LeftPanel.tsx`

- **Couleurs**:
  - 🟢 **Vert**: Backend connecté ET utilisateur actif
  - 🟠 **Orange**: Utilisateur inactif (peu importe le statut du backend)
  - 🔴 **Rouge**: Backend déconnecté (peu importe l'activité de l'utilisateur)
- **Animations**: Pulsation orange quand inactif
- **Badge "Inactif"**: Apparaît quand l'utilisateur est inactif
- **Interactivité**: Clic possible seulement quand inactif

### 3. Arrêt des Requêtes Automatiques

**Fichier modifié**: `frontend/src/stores/queueStore.ts`

- **Nouveau state**: `isInactive` dans le store
- **Logique**: Les requêtes automatiques s'arrêtent quand `isInactive = true`
- **Nouvelles fonctions**:
  - `setInactive(inactive)`: Définit l'état d'inactivité
  - `forceRefresh()`: Force un rafraîchissement après reconnexion

### 4. Reconnexion Manuelle

**Fonctionnalité**: Un seul clic sur l'indicateur orange envoie une requête de reconnexion

**Processus**:
1. Clic sur l'indicateur orange
2. `forceCheck()` dans useBackendStatus
3. `forceRefresh()` dans queueStore
4. Réactivation automatique de la surveillance

## États du Système

| État Backend | État Frontend | Couleur | Animation | Badge | Clicable | Requêtes |
|--------------|---------------|---------|-----------|-------|----------|----------|
| ✅ Connecté | Actif | Vert | Non | Non | Non | ✅ Actives |
| ✅ Connecté | Inactif | Orange | Pulsation | "Inactif" | ✅ Oui | ❌ Arrêtées |
| ❌ Déconnecté | Actif | Rouge | Non | Non | Non | ✅ Actives |
| ❌ Déconnecté | Inactif | Rouge | Non | "Inactif" | ✅ Oui | ❌ Arrêtées |

## Avantages

1. **Économie de ressources**: Plus de requêtes inutiles quand inactif
2. **Feedback visuel clair**: L'utilisateur comprend l'état du système
3. **Reconnexion simple**: Un seul clic pour tenter la reconnexion
4. **Reprise automatique**: La surveillance reprend automatiquement après reconnexion
5. **Robustesse**: Gestion des cas d'erreur et des timeouts

## Logs de Débogage

Les logs suivants apparaissent dans la console du navigateur :

- `🔄 Activité détectée - Réactivation de la surveillance`
- `⏸️ Frontend inactif - Arrêt des requêtes automatiques`
- `🔌 Tentative de reconnexion manuelle...`
- `⏹️ Arrêt de la surveillance automatique`
- `▶️ Reprise de la surveillance automatique`
- `⏸️ Queue: Requêtes automatiques arrêtées (frontend inactif)`
- `🔄 Queue: État d'inactivité changé à true/false`
- `🔄 Queue: Rafraîchissement forcé après reconnexion`

## Tests

Voir le fichier `test_inactivity_detection.md` pour les instructions de test détaillées.

## Compatibilité

- ✅ React 18+
- ✅ TypeScript
- ✅ Zustand (stores)
- ✅ Tailwind CSS
- ✅ Tous les navigateurs modernes

## Maintenance

Pour modifier le comportement :

1. **Timeout d'inactivité**: Modifier `INACTIVITY_TIMEOUT` dans `useBackendStatus.ts`
2. **Couleurs**: Modifier les couleurs dans `utils/colors.ts`
3. **Événements surveillés**: Modifier le tableau `events` dans `useBackendStatus.ts`
4. **Intervalle de surveillance**: Modifier `checkInterval` dans `useBackendStatus.ts` 