# Guide de Dépannage - Boutons et Icônes Unifiés

## 🚨 Problèmes Identifiés et Solutions

### 1. ❌ Actions des boutons ne fonctionnent plus

#### Problème
Les boutons unifiés ne déclenchent plus les actions attendues.

#### Causes Possibles
1. **Fonctions onClick non passées** : Les props `onClick` ne sont pas correctement transmises
2. **Imports manquants** : Les composants `Button`/`IconButton` ne sont pas importés
3. **Props incorrectes** : Les props ne correspondent pas à l'interface attendue

#### Solutions

##### ✅ Vérifier les Imports
```tsx
// CORRECT
import { Button, IconButton } from '../UI/Button';

// INCORRECT
import Button from '../UI/Button';
```

##### ✅ Vérifier les Props onClick
```tsx
// CORRECT
<IconButton
  icon={<EyeIcon />}
  onClick={() => handleView(file)}
  variant="info"
  size="sm"
  tooltip="Visualiser"
/>

// INCORRECT - onClick manquant
<IconButton
  icon={<EyeIcon />}
  variant="info"
  size="sm"
  tooltip="Visualiser"
/>
```

##### ✅ Vérifier les Fonctions
```tsx
// CORRECT - Fonction définie
const handleView = (file) => {
  console.log('Viewing file:', file);
  // Logique de visualisation
};

// INCORRECT - Fonction non définie
<IconButton onClick={() => handleView(file)} />
```

### 2. ❌ Boutons invisibles en mode jour/nuit

#### Problème
Les boutons ne sont pas visibles dans certains modes.

#### Solutions

##### ✅ Vérifier les Couleurs
```tsx
// Le composant Button gère automatiquement les couleurs
// Mais vérifiez que le thème est correctement détecté

// Dans le navigateur, vérifiez :
document.body.getAttribute('data-theme') // Doit retourner 'light' ou 'dark'
```

##### ✅ Forcer les Couleurs si nécessaire
```tsx
<Button
  variant="primary"
  size="sm"
  style={{ 
    borderColor: '#3b82f6',
    color: '#ffffff' // Forcer la couleur si nécessaire
  }}
>
  Action
</Button>
```

### 3. ❌ Animations ne fonctionnent pas

#### Problème
Les animations de hover et click ne s'affichent pas.

#### Solutions

##### ✅ Vérifier les Classes CSS
```tsx
// CORRECT - Classes d'animation incluses
<IconButton
  icon={<EyeIcon />}
  onClick={handleView}
  variant="info"
  size="sm"
  className="transition-all duration-300 ease-in-out hover:scale-110"
/>

// INCORRECT - Classes manquantes
<IconButton
  icon={<EyeIcon />}
  onClick={handleView}
  variant="info"
  size="sm"
/>
```

### 4. ❌ Tooltips ne s'affichent pas

#### Problème
Les tooltips n'apparaissent pas au survol.

#### Solutions

##### ✅ Utiliser la prop tooltip
```tsx
// CORRECT
<IconButton
  icon={<EyeIcon />}
  onClick={handleView}
  variant="info"
  size="sm"
  tooltip="Visualiser le fichier" // Prop tooltip
/>

// INCORRECT - title au lieu de tooltip
<IconButton
  icon={<EyeIcon />}
  onClick={handleView}
  variant="info"
  size="sm"
  title="Visualiser le fichier" // Ne fonctionne pas
/>
```

## 🔧 Composants Vérifiés et Corrigés

### ✅ UnifiedFileViewer
- **Problème** : `renderFloatingActions` ne s'affichait que pour `showImageControls`
- **Solution** : Changé pour vérifier `fileCategory === 'image'`
- **Status** : ✅ Corrigé

### ✅ EmailViewer
- **Problème** : Boutons hardcodés non remplacés
- **Solution** : Remplacé par `IconButton` avec props correctes
- **Status** : ✅ Corrigé

### ✅ TabPanel
- **Problème** : Couleurs hardcodées
- **Solution** : Système de couleurs adaptatif
- **Status** : ✅ Fonctionnel

### ✅ Modal
- **Problème** : Bouton de fermeture hardcodé
- **Solution** : `IconButton` avec animations
- **Status** : ✅ Fonctionnel

## 🧪 Tests à Effectuer

### 1. Test des Actions
```tsx
// Testez chaque bouton pour vérifier que l'action se déclenche
console.log('Button clicked!'); // Ajoutez ceci dans vos fonctions onClick
```

### 2. Test de Visibilité
```tsx
// Vérifiez que les boutons sont visibles dans les deux modes
// Mode sombre : texte blanc
// Mode clair : texte coloré selon le variant
```

### 3. Test des Animations
```tsx
// Survolez les boutons pour vérifier les animations
// - Scale au hover
// - Rotation selon le variant
// - Ombres
```

### 4. Test des Tooltips
```tsx
// Survolez les boutons pour vérifier les tooltips
// Les tooltips doivent apparaître après un court délai
```

## 🚀 Exemples de Code Correct

### Bouton Standard
```tsx
<Button
  variant="primary"
  size="sm"
  icon={<PlayIcon />}
  onClick={() => handleStart()}
  className="transition-all duration-300 ease-in-out hover:scale-105"
>
  Démarrer
</Button>
```

### Bouton d'Icône
```tsx
<IconButton
  icon={<EyeIcon />}
  onClick={() => handleView(file)}
  variant="info"
  size="sm"
  tooltip="Visualiser le fichier"
  className="transition-all duration-300 ease-in-out hover:scale-110"
/>
```

### Bouton de Fermeture
```tsx
<IconButton
  icon={<XMarkIcon />}
  onClick={onClose}
  variant="secondary"
  size="sm"
  tooltip="Fermer"
  className="transition-all duration-300 ease-in-out hover:scale-110 hover:rotate-3"
/>
```

## 🔍 Debugging

### Console Browser
```javascript
// Vérifiez les erreurs dans la console
// Recherchez les erreurs liées aux props ou aux fonctions

// Testez les fonctions directement
handleView && handleView(testFile);
```

### React DevTools
```javascript
// Utilisez React DevTools pour vérifier :
// - Les props passées aux composants
// - L'état des composants
// - Les re-renders
```

## 📞 Support

Si les problèmes persistent :

1. **Vérifiez la console** pour les erreurs JavaScript
2. **Testez les fonctions** individuellement
3. **Vérifiez les imports** et les exports
4. **Comparez avec les exemples** de code correct
5. **Utilisez React DevTools** pour inspecter les composants

---

**Résultat attendu** : Tous les boutons fonctionnent correctement avec animations, couleurs adaptatives et tooltips.
