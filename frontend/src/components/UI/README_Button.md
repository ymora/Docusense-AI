# Système de Boutons Unifiés

## Vue d'ensemble

Le système de boutons unifiés offre une interface cohérente et moderne pour tous les boutons de l'application. Il utilise des traits fins, des animations fluides et une palette de couleurs harmonieuse.

## Composants disponibles

### 1. Button (Bouton standard)

Bouton avec texte et optionnellement une icône.

```tsx
import { Button } from '../UI/Button';

<Button
  onClick={() => handleAction()}
  variant="primary"
  size="sm"
  icon={<PlayIcon />}
  disabled={false}
>
  Démarrer
</Button>
```

### 2. IconButton (Bouton d'icône)

Bouton compact pour les actions d'icônes uniquement.

```tsx
import { IconButton } from '../UI/Button';

<IconButton
  icon={<EyeIcon />}
  onClick={() => handleView()}
  variant="info"
  size="sm"
  tooltip="Visualiser le fichier"
/>
```

## Variants disponibles

| Variant | Couleur | Usage |
|---------|---------|-------|
| `primary` | Bleu | Actions principales |
| `secondary` | Gris | Actions secondaires |
| `success` | Vert | Actions de succès |
| `warning` | Orange | Actions d'avertissement |
| `danger` | Rouge | Actions destructives |
| `info` | Violet | Actions d'information |

## Tailles disponibles

| Size | Padding | Texte | Icône |
|------|---------|-------|-------|
| `xs` | px-2 py-1 | text-xs | w-3 h-3 |
| `sm` | px-3 py-1.5 | text-sm | w-4 h-4 |
| `md` | px-4 py-2 | text-sm | w-4 h-4 |
| `lg` | px-6 py-3 | text-base | w-5 h-5 |

## Animations

Tous les boutons incluent :
- **Hover** : Scale +105%, rotation légère, ombre
- **Active** : Scale 95%, rotation reset
- **Icônes** : Scale 125% au hover
- **Transitions** : 300ms ease-in-out

## Exemples d'utilisation

### Actions de statut
```tsx
<Button
  variant="primary"
  size="sm"
  icon={<PlayIcon />}
  onClick={() => startAnalysis()}
>
  Démarrer
</Button>
```

### Actions utilitaires
```tsx
<div className="flex gap-2">
  <IconButton
    icon={<EyeIcon />}
    variant="info"
    tooltip="Visualiser"
    onClick={() => viewFile()}
  />
  <IconButton
    icon={<DocumentDuplicateIcon />}
    variant="primary"
    tooltip="Dupliquer"
    onClick={() => duplicateItem()}
  />
  <IconButton
    icon={<TrashIcon />}
    variant="danger"
    tooltip="Supprimer"
    onClick={() => deleteItem()}
  />
</div>
```

### Actions globales
```tsx
<div className="flex gap-2">
  <Button
    variant="warning"
    size="sm"
    icon={<PauseIcon />}
    onClick={() => pauseAll()}
  >
    Pause
  </Button>
  <Button
    variant="success"
    size="sm"
    icon={<PlayIcon />}
    onClick={() => resumeAll()}
  >
    Reprendre
  </Button>
</div>
```

## Migration depuis l'ancien système

### Avant
```tsx
<button
  className="px-3 py-1.5 border-2 text-xs font-medium rounded-lg text-white transition-all duration-300 ease-in-out hover:scale-105 hover:rotate-2 hover:shadow-lg active:scale-95 active:rotate-0"
  style={{
    backgroundColor: 'transparent',
    borderColor: '#3b82f6',
  }}
>
  <PlayIcon className="w-3 h-3 mr-1" />
  Démarrer
</button>
```

### Après
```tsx
<Button
  variant="primary"
  size="sm"
  icon={<PlayIcon />}
  onClick={() => handleStart()}
>
  Démarrer
</Button>
```

## Bonnes pratiques

1. **Utilisez les variants appropriés** : `danger` pour supprimer, `success` pour confirmer, etc.
2. **Choisissez la bonne taille** : `sm` pour les actions de ligne, `md` pour les actions principales
3. **Ajoutez des tooltips** : Particulièrement pour les `IconButton`
4. **Gérez les états disabled** : Désactivez les boutons quand l'action n'est pas possible
5. **Utilisez les icônes** : Améliore l'UX et la reconnaissance visuelle

## Personnalisation

Pour personnaliser les couleurs ou animations, modifiez le fichier `Button.tsx` :

```tsx
// Ajouter un nouveau variant
case 'custom':
  return {
    border: '#your-color',
    hover: '#your-hover-color',
    text: '#ffffff'
  };
```
