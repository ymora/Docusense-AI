# Système de Confirmation Modal

## Vue d'ensemble

Le nouveau système de confirmation remplace les fenêtres `window.confirm` natives par des modales personnalisées qui s'adaptent au thème jour/nuit de l'application.

## Composants

### ConfirmationModal
Modal personnalisé avec support des thèmes jour/nuit.

### GlobalConfirmation
Composant global qui affiche les confirmations dans toute l'application.

### useConfirmDialog
Hook utilitaire pour utiliser facilement le système de confirmation.

## Utilisation

### 1. Import du hook
```typescript
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
```

### 2. Utilisation dans un composant
```typescript
const { confirm, confirmDelete, confirmAction } = useConfirmDialog();

// Confirmation simple
confirm(
  'Êtes-vous sûr de vouloir effectuer cette action ?',
  () => {
    // Action à effectuer
    console.log('Action confirmée');
  }
);

// Confirmation de suppression
confirmDelete(
  'ce fichier',
  () => {
    // Suppression du fichier
    deleteFile();
  }
);

// Confirmation d'action personnalisée
confirmAction(
  'supprimer',
  'tous les éléments sélectionnés',
  () => {
    // Suppression des éléments
    deleteSelectedItems();
  },
  'danger' // Type de confirmation
);
```

## Types de confirmation

- `'danger'` : Rouge pour les actions destructives
- `'warning'` : Orange pour les actions importantes
- `'info'` : Bleu pour les actions informatives

## Avantages

1. **Adaptation au thème** : S'adapte automatiquement au mode jour/nuit
2. **Déplaçable** : Modal personnalisé au lieu de fenêtre native
3. **Personnalisable** : Titres, messages et boutons personnalisables
4. **Cohérent** : Design uniforme dans toute l'application
5. **Accessible** : Support des raccourcis clavier (Echap pour fermer)

## Exemple d'implémentation

Voir `QueueIAAdvanced.tsx` pour un exemple complet d'utilisation dans la gestion des actions de suppression.
