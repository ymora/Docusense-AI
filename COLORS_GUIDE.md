# 🎨 Guide des Couleurs Centralisées

## 📋 Vue d'ensemble

Toutes les couleurs de l'interface utilisateur sont maintenant centralisées dans un seul endroit pour faciliter les modifications futures.

### 📁 Fichiers de couleurs

- **`frontend/src/utils/colors.ts`** : Définition de toutes les couleurs
- **`frontend/src/hooks/useColors.ts`** : Hooks pour utiliser les couleurs
- **`frontend/src/App.css`** : Variables CSS (maintenues pour compatibilité)

## 🎯 Utilisation dans les composants

### 1. Hook principal `useColors`

```typescript
import { useColors } from '../hooks/useColors';

const MyComponent = () => {
  const { colors, colorMode, isDark } = useColors();
  
  return (
    <div style={{ color: colors.primary }}>
      Mode actuel : {colorMode}
      Couleur config : {colors.config}
    </div>
  );
};
```

### 2. Hook spécialisé `usePanelColors`

```typescript
import { usePanelColors } from '../hooks/useColors';

const PanelComponent = () => {
  const { config, queue, analyses } = usePanelColors();
  
  return (
    <div>
      <button style={{ color: config }}>Configuration</button>
      <button style={{ color: queue }}>File d'attente</button>
      <button style={{ color: analyses }}>Analyses</button>
    </div>
  );
};
```

### 3. Hook spécialisé `useStatusColors`

```typescript
import { useStatusColors } from '../hooks/useColors';

const StatusComponent = () => {
  const { pending, completed, failed, getStatusColor } = useStatusColors();
  
  return (
    <div>
      <span style={{ color: pending }}>En attente</span>
      <span style={{ color: completed }}>Terminé</span>
      <span style={{ color: getStatusColor('processing') }}>En cours</span>
    </div>
  );
};
```

## 🎨 Modification des couleurs

### Pour changer une couleur spécifique

1. **Ouvrir** `frontend/src/utils/colors.ts`
2. **Localiser** la couleur à modifier
3. **Changer** la valeur hexadécimale
4. **Sauvegarder** - Les changements s'appliquent automatiquement

### Exemple : Changer la couleur de Configuration IA

```typescript
// Dans frontend/src/utils/colors.ts
export const COLORS = {
  dark: {
    config: '#3b82f6', // ← Changer cette valeur
    // ...
  },
  light: {
    config: '#2563eb', // ← Et cette valeur
    // ...
  }
};
```

### Exemple : Ajouter une nouvelle couleur

```typescript
// Dans frontend/src/utils/colors.ts
export const COLORS = {
  dark: {
    // Couleurs existantes...
    newColor: '#ff6b6b', // ← Nouvelle couleur
  },
  light: {
    // Couleurs existantes...
    newColor: '#e74c3c', // ← Version mode clair
  }
};

// Ajouter dans CSS_VARIABLES
export const CSS_VARIABLES = {
  dark: {
    // Variables existantes...
    '--new-color': COLORS.dark.newColor,
  },
  light: {
    // Variables existantes...
    '--new-color': COLORS.light.newColor,
  }
};
```

## 🎯 Structure des couleurs

### Couleurs principales des panneaux
- `config` : Configuration IA (Bleu)
- `queue` : File d'attente (Jaune)
- `analyses` : Analyses terminées (Vert)

### Couleurs de statut
- `pending` : En attente (Jaune)
- `processing` : En cours (Bleu)
- `completed` : Terminé (Vert)
- `failed` : Échec (Rouge)
- `paused` : En pause (Jaune)
- `unsupported` : Non supporté (Gris)

### Couleurs du thème
- `background` : Fond principal
- `surface` : Surfaces (panneaux, cartes)
- `text` : Texte principal
- `textSecondary` : Texte secondaire
- `border` : Bordures

### Couleurs d'accent
- `primary` : Couleur principale
- `success` : Succès
- `warning` : Avertissement
- `error` : Erreur

## 🔄 Adaptation automatique

### Mode jour/nuit
Les couleurs s'adaptent automatiquement selon le thème :
- **Mode sombre** : Couleurs plus claires
- **Mode clair** : Couleurs plus foncées

### Variables CSS
Les variables CSS sont automatiquement mises à jour :
```css
:root {
  --config-color: #3b82f6;    /* Mode sombre */
}

body[data-theme="light"] {
  --config-color: #2563eb;    /* Mode clair */
}
```

## 🎨 Hover effects et Animations

### Hover effects
Les couleurs de hover sont également centralisées :
```typescript
const { colors } = useColors();
const hoverColor = colors.hover.config; // rgba(59, 130, 246, 0.1)
```

### Animations d'activation
Les boutons de panneaux utilisent des animations subtiles au lieu de remplissage de couleur :
- **Scale** : Légère augmentation de taille (1.1x)
- **Ring** : Bordure colorée avec opacité
- **Pulse** : Animation de pulsation pour les boutons actifs
- **Transition** : Animation fluide de 300ms

## 🔧 Optimisations Interface

### Champs de Saisie
- **Œil unique** : Utilisation de l'œil natif du navigateur pour les champs `type="password"`
- **Suppression redondance** : Plus de double œil dans les champs de clés API
- **Interface épurée** : Moins d'éléments visuels superflus

### Code Simplifié
```typescript
// AVANT (double œil)
<input type={showApiKeys[name] ? 'text' : 'password'} />
<button><EyeIcon /></button>

// APRÈS (œil unique)
<input type="password" />
// L'œil natif du navigateur apparaît automatiquement
```

### Classes CSS utilisées
```css
/* Bouton actif */
.scale-110 .ring-2 .ring-blue-500 .ring-opacity-50

/* Animation de pulsation */
@keyframes configPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3); }
}
```

## 📝 Bonnes pratiques

### ✅ À faire
- Utiliser les hooks `useColors`, `usePanelColors`, `useStatusColors`
- Modifier les couleurs uniquement dans `colors.ts`
- Tester en mode jour et nuit
- Documenter les nouvelles couleurs

### ❌ À éviter
- Définir des couleurs en dur dans les composants
- Modifier directement les variables CSS dans App.css
- Oublier de tester les deux modes

## 🔧 Migration des couleurs existantes

Pour migrer un composant existant :

1. **Remplacer** les couleurs en dur par les hooks
2. **Supprimer** les styles inline avec des couleurs
3. **Utiliser** les variables CSS ou les hooks

### Avant
```typescript
<div style={{ color: '#3b82f6' }}>Configuration</div>
```

### Après
```typescript
const { colors } = useColors();
<div style={{ color: colors.config }}>Configuration</div>
```

## 🎯 Avantages

- **Maintenabilité** : Une seule source de vérité pour les couleurs
- **Cohérence** : Toutes les couleurs sont harmonisées
- **Flexibilité** : Changement global en un seul endroit
- **Type safety** : TypeScript pour éviter les erreurs
- **Performance** : Pas de recalculs inutiles

---

**Note** : Ce système remplace progressivement les couleurs définies en dur dans les composants. Tous les nouveaux composants doivent utiliser ce système centralisé. 