# 🎨 Interface Utilisateur - DocuSense AI

## 🎯 Design Principles

### Philosophie de Design
- **Style très fin** : Lignes minces, bordures minimales
- **Thème sombre** : Interface moderne et reposante
- **Design minimaliste** : Interface épurée sans encombrement
- **Icônes bleu clair** : Cohérence visuelle avec le sélecteur de disque
- **Texte informatif** : Uniquement dans les zones de sélection

### Palette de Couleurs
```css
/* Couleurs principales */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* Thème sombre */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f8fafc;
--text-secondary: #cbd5e1;
--border-color: #334155;
```

## 📱 Composants React

### Composants Principaux

#### DiskSelector
**Fichier :** `frontend/src/components/DiskSelector.tsx`
**Fonction :** Sélection de disques avec dialogue de fichiers
**Fonctionnalités :**
- Dialogue de sélection de fichiers natif
- Affichage des disques disponibles
- Navigation dans l'arborescence
- Gestion des erreurs de connexion

#### FileTreeSimple
**Fichier :** `frontend/src/components/FileTreeSimple.tsx`
**Fonction :** Arborescence de fichiers simplifiée
**Fonctionnalités :**
- Affichage hiérarchique des fichiers
- Icônes selon le type de fichier
- Sélection multiple
- Filtrage par type

#### QueueIAAdvanced
**Fichier :** `frontend/src/components/QueueIAAdvanced.tsx`
**Fonction :** Gestion avancée de la queue d'analyses
**Fonctionnalités :**
- Suivi en temps réel des analyses
- Contrôles de pause/reprise
- Métriques de performance
- Gestion des erreurs

#### ConfigWindow
**Fichier :** `frontend/src/components/ConfigWindow.tsx`
**Fonction :** Configuration des providers IA
**Fonctionnalités :**
- Configuration des clés API
- Test des providers
- Gestion des priorités
- Validation des paramètres

#### EmailViewer
**Fichier :** `frontend/src/components/EmailViewer.tsx`
**Fonction :** Visualisation des emails avec pièces jointes
**Fonctionnalités :**
- Parsing des emails EML/MSG
- Affichage des métadonnées
- Gestion des pièces jointes
- Export des données

#### FileResultViewer
**Fichier :** `frontend/src/components/FileResultViewer.tsx`
**Fonction :** Affichage des résultats d'analyses
**Fonctionnalités :**
- Visualisation des résultats IA
- Export en PDF
- Partage des analyses
- Historique des versions

#### UsageLimits
**Fichier :** `frontend/src/components/UsageLimits.tsx`
**Fonction :** Limites d'usage pour les invités
**Fonctionnalités :**
- Affichage des quotas
- Alertes de dépassement
- Suggestions d'upgrade
- Statistiques d'usage

### Composants de Support

#### AuthManager
**Fichier :** `frontend/src/components/AuthManager.tsx`
**Fonction :** Gestion de l'authentification
**Fonctionnalités :**
- Connexion/déconnexion
- Gestion des sessions
- Validation des tokens
- Redirection automatique

#### FileManager
**Fichier :** `frontend/src/components/FileManager.tsx`
**Fonction :** Gestion des fichiers
**Fonctionnalités :**
- Upload de fichiers
- Prévisualisation
- Métadonnées
- Actions contextuelles

#### VideoPlayer
**Fichier :** `frontend/src/components/VideoPlayer.tsx`
**Fonction :** Lecteur vidéo intégré
**Fonctionnalités :**
- Support multi-formats
- Contrôles personnalisés
- Streaming adaptatif
- Métadonnées vidéo

#### ImageViewer
**Fichier :** `frontend/src/components/ImageViewer.tsx`
**Fonction :** Visualiseur d'images
**Fonctionnalités :**
- Zoom et navigation
- Support RAW
- Métadonnées EXIF
- Export optimisé

#### AudioPlayer
**Fichier :** `frontend/src/components/AudioPlayer.tsx`
**Fonction :** Lecteur audio intégré
**Fonctionnalités :**
- Support multi-formats
- Visualisation spectrale
- Métadonnées audio
- Contrôles avancés

## 📊 Stores Zustand

### AuthStore
**Fichier :** `frontend/src/stores/authStore.ts`
```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**Fonctionnalités :**
- Gestion de l'état d'authentification
- Stockage sécurisé des tokens
- Synchronisation avec localStorage
- Gestion des erreurs de connexion

### ConfigStore
**Fichier :** `frontend/src/stores/configStore.ts`
```typescript
interface ConfigStore {
  aiProviders: AIProvider[];
  selectedProvider: string;
  uiConfig: UIConfig;
  isLoading: boolean;
  setAIProviders: (providers: AIProvider[]) => void;
  setSelectedProvider: (provider: string) => void;
  saveAPIKey: (provider: string, key: string) => Promise<void>;
  testProvider: (provider: string) => Promise<void>;
}
```

**Fonctionnalités :**
- Configuration des providers IA
- Gestion des clés API
- Tests de connectivité
- Synchronisation des paramètres

### AnalysisStore
**Fichier :** `frontend/src/stores/analysisStore.ts`
```typescript
interface AnalysisStore {
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  queue: Analysis[];
  isLoading: boolean;
  setAnalyses: (analyses: Analysis[]) => void;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (id: number, updates: Partial<Analysis>) => void;
  removeAnalysis: (id: number) => void;
}
```

**Fonctionnalités :**
- Gestion de la queue d'analyses
- Suivi en temps réel
- Mise à jour automatique
- Gestion des erreurs

### PromptStore
**Fichier :** `frontend/src/stores/promptStore.ts`
```typescript
interface PromptStore {
  prompts: Prompt[];
  specializedPrompts: Prompt[];
  defaultPrompts: Prompt[];
  selectedPrompt: Prompt | null;
  setPrompts: (prompts: Prompt[]) => void;
  setSelectedPrompt: (prompt: Prompt | null) => void;
  getPromptsByDomain: (domain: string) => Prompt[];
}
```

**Fonctionnalités :**
- Gestion des prompts spécialisés
- Catégorisation par domaine
- Sélection intelligente
- Personnalisation

### FileStore
**Fichier :** `frontend/src/stores/fileStore.ts`
```typescript
interface FileStore {
  files: File[];
  selectedFiles: File[];
  currentDirectory: string;
  isLoading: boolean;
  setFiles: (files: File[]) => void;
  selectFile: (file: File) => void;
  setCurrentDirectory: (path: string) => void;
  clearSelection: () => void;
}
```

**Fonctionnalités :**
- Gestion des fichiers sélectionnés
- Navigation dans l'arborescence
- État de chargement
- Synchronisation avec le backend

### UIStore
**Fichier :** `frontend/src/stores/uiStore.ts`
```typescript
interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  modalOpen: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setModalOpen: (open: boolean) => void;
}
```

**Fonctionnalités :**
- Gestion du thème
- État de l'interface
- Modales et overlays
- Préférences utilisateur

### StartupStore
**Fichier :** `frontend/src/stores/startupStore.ts`
```typescript
interface StartupStore {
  isInitialized: boolean;
  initializationStep: string;
  errors: string[];
  setInitialized: (initialized: boolean) => void;
  setInitializationStep: (step: string) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
}
```

**Fonctionnalités :**
- Gestion du démarrage
- Suivi des étapes d'initialisation
- Gestion des erreurs
- État de l'application

## 🎨 Design System

### Typographie
```css
/* Hiérarchie typographique */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
```

### Espacement
```css
/* Système d'espacement */
.space-1 { margin: 0.25rem; }
.space-2 { margin: 0.5rem; }
.space-3 { margin: 0.75rem; }
.space-4 { margin: 1rem; }
.space-6 { margin: 1.5rem; }
.space-8 { margin: 2rem; }
```

### Bordures
```css
/* Bordures minimales */
.border-thin { border-width: 1px; }
.border-light { border-color: #334155; }
.rounded-sm { border-radius: 0.125rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
```

### Animations
```css
/* Transitions fluides */
.transition-all { transition: all 0.2s ease-in-out; }
.transition-opacity { transition: opacity 0.2s ease-in-out; }
.transition-transform { transition: transform 0.2s ease-in-out; }
```

## 🔧 Hooks Personnalisés

### useTheme
**Fichier :** `frontend/src/hooks/useTheme.ts`
**Fonction :** Gestion du thème
```typescript
const { theme, setTheme, toggleTheme } = useTheme();
```

### useColors
**Fichier :** `frontend/src/hooks/useColors.ts`
**Fonction :** Gestion des couleurs
```typescript
const { primaryColor, secondaryColor, accentColor } = useColors();
```

### useTypography
**Fichier :** `frontend/src/hooks/useTypography.ts`
**Fonction :** Gestion de la typographie
```typescript
const { fontFamily, fontSize, lineHeight } = useTypography();
```

### useViewportHeight
**Fichier :** `frontend/src/hooks/useViewportHeight.ts`
**Fonction :** Gestion de la hauteur viewport
```typescript
const { viewportHeight, isMobile } = useViewportHeight();
```

### useConfirmDialog
**Fichier :** `frontend/src/hooks/useConfirmDialog.ts`
**Fonction :** Dialogues de confirmation
```typescript
const { showConfirm, confirmDialog } = useConfirmDialog();
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Adaptations Mobile
- **Navigation** : Menu hamburger
- **Fichiers** : Liste verticale
- **Analyses** : Cartes empilées
- **Configuration** : Formulaire étendu

### Adaptations Desktop
- **Navigation** : Sidebar fixe
- **Fichiers** : Grille responsive
- **Analyses** : Tableau détaillé
- **Configuration** : Panneau latéral

## 🎯 Accessibilité

### Standards WCAG 2.1
- **Contraste** : Ratio minimum 4.5:1
- **Navigation** : Support clavier complet
- **Lecteurs d'écran** : Labels et descriptions
- **Focus** : Indicateurs visuels clairs

### Fonctionnalités d'Accessibilité
- **Raccourcis clavier** : Navigation rapide
- **Mode sombre** : Réduction de la fatigue visuelle
- **Taille de police** : Ajustable
- **Animations** : Désactivables

## 🚀 Performance

### Optimisations
- **Code splitting** : Chargement à la demande
- **Lazy loading** : Composants différés
- **Memoization** : Cache des calculs
- **Virtualization** : Listes longues

### Métriques
- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **First Input Delay** : < 100ms
