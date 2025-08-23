# Gestion de la Connexion Backend - DocuSense AI

## Vue d'ensemble

Ce document décrit l'implémentation de la gestion de la connexion backend dans DocuSense AI, permettant de désactiver les boutons de connexion et de création d'utilisateur quand le backend n'est pas disponible.

## Fonctionnalités implémentées

### 1. Hook useBackendConnection

**Fichier :** `frontend/src/hooks/useBackendConnection.ts`

- **Vérification périodique :** Toutes les 2 secondes
- **Timeout :** 2 secondes pour éviter de bloquer l'interface
- **États gérés :**
  - `isConnected` : Backend disponible
  - `isLoading` : Vérification en cours
  - `lastCheck` : Dernière vérification
  - `error` : Message d'erreur

### 2. Indicateur de statut visuel

**Fichier :** `frontend/src/components/UI/BackendStatusIndicator.tsx`

- **Indicateur coloré :**
  - 🟢 Vert : Backend connecté
  - 🔴 Rouge : Backend indisponible
  - 🟠 Orange : Vérification en cours
- **Tailles disponibles :** sm, md, lg
- **Texte optionnel :** Affichage du statut

### 3. Désactivation des boutons

#### Page de connexion principale
**Fichier :** `frontend/src/components/Layout/Layout.tsx`

- **Boutons désactivés :**
  - "Se connecter" → "Backend indisponible"
  - "Mode invité" → "Indisponible"
  - "Créer un compte" → "Indisponible"

#### Modales de connexion/inscription
**Fichier :** `frontend/src/components/UI/UserIcon.tsx`

- **Indicateur d'alerte :** Affiché quand le backend est indisponible
- **Boutons d'envoi désactivés :** Impossible de soumettre les formulaires
- **Messages d'erreur :** Informations sur l'indisponibilité

#### Composant UsageLimits
**Fichier :** `frontend/src/components/UI/UsageLimits.tsx`

- **Bouton de création de compte :** Désactivé si backend indisponible

## Logique de fonctionnement

### 1. Vérification automatique
- Le hook `useBackendConnection` vérifie la santé du backend toutes les 2 secondes
- Endpoint utilisé : `/api/health/`
- Timeout de 2 secondes pour éviter les blocages

### 2. Vérification forcée
- Avant chaque action d'authentification, une vérification immédiate est forcée
- Fonction `forceCheck()` disponible dans le hook
- Permet de détecter rapidement les changements d'état

### 3. Gestion des états
- **Connecté :** Tous les boutons actifs
- **Déconnecté :** Boutons désactivés avec messages explicites
- **Vérification :** Boutons désactivés avec indicateur de chargement

## Avantages

### 1. Expérience utilisateur améliorée
- Feedback visuel immédiat sur l'état du backend
- Messages clairs sur les actions impossibles
- Pas de tentatives d'actions vouées à l'échec

### 2. Robustesse
- Détection automatique des déconnexions
- Réactivation automatique quand le backend revient
- Gestion gracieuse des timeouts

### 3. Performance
- Vérifications légères (timeout court)
- Pas de blocage de l'interface
- Mise à jour en temps réel

## Utilisation

### Dans un composant React

```typescript
import { useBackendConnection } from '../../hooks/useBackendConnection';

const MyComponent = () => {
  const { isConnected, isLoading, forceCheck } = useBackendConnection();
  
  const handleAction = async () => {
    await forceCheck(); // Vérification immédiate
    if (isConnected && !isLoading) {
      // Action possible
    }
  };
  
  return (
    <button 
      disabled={!isConnected || isLoading}
      onClick={handleAction}
    >
      {isLoading ? 'Vérification...' : 
       isConnected ? 'Action' : 'Indisponible'}
    </button>
  );
};
```

### Affichage de l'indicateur

```typescript
import { BackendStatusIndicator } from '../UI/BackendStatusIndicator';

<BackendStatusIndicator size="sm" showText={true} />
```

## Configuration

### Intervalle de vérification
Modifier dans `useBackendConnection.ts` :
```typescript
export const useBackendConnection = (checkInterval: number = 2000) => {
```

### Timeout de requête
Modifier dans `useBackendConnection.ts` :
```typescript
signal: AbortSignal.timeout(2000),
```

## Maintenance

### Ajout d'un nouveau bouton sensible
1. Importer le hook `useBackendConnection`
2. Utiliser `isConnected` et `isLoading` pour désactiver le bouton
3. Ajouter `forceCheck()` avant l'action
4. Gérer les messages d'erreur appropriés

### Modification de l'endpoint de santé
Modifier l'URL dans `useBackendConnection.ts` :
```typescript
const response = await fetch('/api/health/', {
```

## Conclusion

Cette implémentation garantit une expérience utilisateur fluide en gérant automatiquement l'état de connexion du backend. Les utilisateurs sont informés en temps réel de la disponibilité des services et ne peuvent pas effectuer d'actions qui échoueraient.
