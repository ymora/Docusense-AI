# Gestion Professionnelle de la Hauteur d'Écran

## 🎯 Problème

Les développeurs professionnels rencontrent plusieurs défis avec la gestion de la hauteur d'écran :

1. **Barres d'adresse mobiles** qui apparaissent/disparaissent
2. **Barres de navigation** qui changent de taille
3. **Barres des tâches** sur desktop
4. **Orientations différentes** (portrait/paysage)
5. **Taille d'écran variable** (responsive design)

## ✅ Solutions Professionnelles

### 1. **Variables CSS Personnalisées**

```css
:root {
  --vh: 1vh;
  --app-height: 100vh;
}

.h-screen-dynamic {
  height: var(--app-height, 100vh);
  height: calc(var(--vh, 1vh) * 100);
}
```

### 2. **Hook React Personnalisé**

```typescript
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    document.addEventListener('visibilitychange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      document.removeEventListener('visibilitychange', updateHeight);
    };
  }, []);

  return viewportHeight;
};
```

### 3. **Événements Écoutés**

- **`resize`** : Changement de taille de fenêtre
- **`orientationchange`** : Rotation d'écran (mobile)
- **`visibilitychange`** : Barres d'adresse mobiles

## 🚀 Avantages de cette Approche

### ✅ **Robuste**
- Fonctionne sur tous les appareils
- Gère les changements dynamiques
- Fallback vers `100vh` si nécessaire

### ✅ **Performance**
- Utilise les variables CSS natives
- Pas de recalcul constant
- Optimisé pour le rendu

### ✅ **Maintenable**
- Code centralisé
- Réutilisable
- Facile à déboguer

### ✅ **Accessible**
- Respecte les préférences utilisateur
- Compatible avec les lecteurs d'écran
- Fonctionne avec le zoom navigateur

## 📱 Support Mobile

### **iOS Safari**
- Gère les barres d'adresse
- Support de l'orientation
- Compatible avec le mode plein écran

### **Android Chrome**
- Gère les barres de navigation
- Support du mode multi-fenêtre
- Compatible avec les gestes

## 🎨 Utilisation

### **Dans les Composants**
```tsx
<div className="min-h-screen-dynamic">
  {/* Contenu */}
</div>
```

### **Avec le Hook**
```tsx
const viewportHeight = useViewportHeight();
const availableHeight = useAvailableHeight(60); // 60px d'offset
```

## 🔧 Configuration

### **Classes CSS Disponibles**
- `.h-screen-dynamic` : Hauteur fixe
- `.min-h-screen-dynamic` : Hauteur minimale
- `.max-h-screen-dynamic` : Hauteur maximale

### **Variables CSS**
- `--vh` : 1% de la hauteur d'écran
- `--app-height` : Hauteur totale de l'écran

## 📊 Comparaison des Approches

| Approche | Robustesse | Performance | Maintenance |
|----------|------------|-------------|-------------|
| `100vh` fixe | ❌ | ✅ | ✅ |
| `calc(100vh - Xpx)` | ❌ | ✅ | ❌ |
| **Variables CSS** | ✅ | ✅ | ✅ |
| **Hook React** | ✅ | ✅ | ✅ |

## 🎯 Recommandations

1. **Toujours utiliser les variables CSS** pour la hauteur
2. **Initialiser le hook** au niveau de l'App
3. **Tester sur mobile** avec différentes orientations
4. **Vérifier l'accessibilité** avec les outils de développement
5. **Documenter les cas d'usage** spécifiques

## 🔍 Debugging

### **Vérifier les Variables**
```javascript
// Dans la console
getComputedStyle(document.documentElement).getPropertyValue('--vh')
getComputedStyle(document.documentElement).getPropertyValue('--app-height')
```

### **Tester les Événements**
```javascript
// Simuler un changement d'orientation
window.dispatchEvent(new Event('orientationchange'))
```

Cette approche est utilisée par les applications professionnelles comme :
- **Discord**
- **Slack**
- **Notion**
- **Figma**
- **GitHub** 