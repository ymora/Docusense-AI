# Test de la Détection d'Inactivité et Reconnexion Manuelle

## Fonctionnalités Implémentées

### 1. Détection d'Inactivité
- **Timeout**: 1 minute d'inactivité
- **Événements surveillés**: mousedown, mousemove, keypress, scroll, touchstart, click
- **État inactif**: Se déclenche seulement si le backend est déconnecté ET que l'utilisateur est inactif

### 2. Indicateur Visuel Amélioré
- **Couleur verte**: Backend connecté ET utilisateur actif
- **Couleur orange**: Utilisateur inactif (peu importe le statut du backend)
- **Couleur rouge**: Backend déconnecté (peu importe l'activité de l'utilisateur)
- **Animation**: Pulsation orange quand inactif
- **Badge "Inactif"**: Apparaît quand l'utilisateur est inactif

### 3. Reconnexion Manuelle
- **Clic sur l'indicateur**: Seulement possible quand inactif
- **Action**: Envoie une seule requête de reconnexion
- **Feedback**: Hover effect et tooltip explicatif

### 4. Arrêt des Requêtes Continues
- **Queue Store**: Arrête les requêtes automatiques quand inactif
- **Backend Status**: Arrête la surveillance périodique quand inactif
- **Reprise**: Redémarre automatiquement après reconnexion

## Comment Tester

### Test 1: Détection d'Inactivité
1. Démarrer l'application (backend + frontend)
2. Attendre que l'indicateur devienne vert (backend connecté)
3. Ne pas bouger la souris ni cliquer pendant 1 minute
4. **Résultat attendu**: L'indicateur devient orange avec animation et badge "Inactif"

### Test 2: Reconnexion Manuelle
1. Dans l'état inactif (orange + badge "Inactif")
2. Cliquer sur l'indicateur orange
3. **Résultat attendu**: Une seule requête de reconnexion est envoyée
4. **Résultat attendu**: L'indicateur redevient vert si le backend est connecté

### Test 3: Backend Déconnecté
1. Arrêter le backend (Ctrl+C dans le terminal backend)
2. **Résultat attendu**: L'indicateur devient rouge
3. Si l'utilisateur est inactif, le badge "Inactif" apparaît mais la couleur reste rouge

### Test 4: Arrêt des Requêtes Continues
1. Arrêter le backend
2. Attendre l'état inactif
3. Ouvrir les DevTools (F12) → Network
4. **Résultat attendu**: Plus de requêtes automatiques vers `/api/health` ou `/api/queue/*`

### Test 5: Reprise Automatique
1. Dans l'état inactif
2. Redémarrer le backend
3. **Résultat attendu**: L'indicateur redevient vert automatiquement
4. Les requêtes automatiques reprennent

## États Visuels

| État | Couleur | Animation | Badge | Clicable |
|------|---------|-----------|-------|----------|
| Connecté + Actif | Vert | Non | Non | Non |
| Connecté + Inactif | Orange | Pulsation | "Inactif" | Oui |
| Déconnecté + Actif | Rouge | Non | Non | Non |
| Déconnecté + Inactif | Rouge | Non | "Inactif" | Oui |

## Logs de Débogage

Pour voir les logs de débogage, ouvrir la console du navigateur (F12) et observer :
- Messages de détection d'inactivité
- Tentatives de reconnexion
- Arrêt/reprise de la surveillance 