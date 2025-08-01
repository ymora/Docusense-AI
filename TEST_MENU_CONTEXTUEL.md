# Test du Menu Contextuel - Analyse IA

## 🎯 Objectif
Vérifier que le menu contextuel "Analyser avec IA" fonctionne correctement.

## 📋 Étapes de test

### 1. Prérequis
- ✅ Backend démarré sur `http://localhost:8000`
- ✅ Frontend démarré sur `http://localhost:3000`
- ✅ Console du navigateur ouverte (F12)

### 2. Test du menu contextuel

#### Étape 1 : Navigation
1. Ouvrir `http://localhost:3000`
2. Sélectionner un disque dans le panneau de gauche
3. Naviguer vers un dossier contenant des fichiers

#### Étape 2 : Test du clic droit
1. **Clic droit** sur un fichier compatible (PDF, TXT, DOCX, etc.)
2. Vérifier que le menu contextuel apparaît
3. Vérifier que le bouton "Analyser avec IA..." est visible

#### Étape 3 : Test de l'action
1. **Clic gauche** sur "Analyser avec IA..."
2. Vérifier dans la console les logs :
   ```
   🎯 ContextMenu: Clic sur "Analyser avec IA" pour le fichier: {...}
   🎯 ContextMenu: Type compatible: true
   🎯 LeftPanel: Action reçue: analyze_ia pour le fichier: {...}
   🎯 LeftPanel: Événement fileAction dispatché
   🎯 Layout: Événement fileAction reçu: {...}
   🎯 Layout: Action IA détectée pour le fichier: {...}
   🎯 Layout: FileIds à analyser: [...]
   ```

#### Étape 4 : Test du PromptSelector
1. Vérifier que le PromptSelector s'ouvre
2. Vérifier que les prompts sont chargés
3. Sélectionner un prompt
4. Cliquer sur "Créer X analyse(s) en attente"

### 3. Types de fichiers compatibles
- ✅ `application/pdf` - PDF
- ✅ `text/plain` - Fichiers texte
- ✅ `application/msword` - DOC
- ✅ `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - DOCX
- ✅ `message/rfc822` - Emails
- ✅ `text/html` - HTML
- ✅ `image/*` - Images
- ✅ `audio/*` - Audio
- ✅ `video/*` - Vidéos

### 4. Dépannage

#### Le menu contextuel n'apparaît pas
- Vérifier que le clic droit fonctionne sur d'autres éléments
- Vérifier les erreurs dans la console

#### Le bouton "Analyser avec IA" est grisé
- Vérifier le type MIME du fichier
- Vérifier que le fichier est dans la liste des types compatibles

#### L'événement n'est pas reçu
- Vérifier que tous les logs apparaissent dans la console
- Vérifier que le Layout écoute bien l'événement `fileAction`

#### Le PromptSelector ne s'ouvre pas
- Vérifier que `showPromptSelector` est bien mis à `true`
- Vérifier que le composant PromptSelector est bien rendu

## 🔧 Logs de débogage

Les logs suivants doivent apparaître dans l'ordre :

1. `🎯 ContextMenu: Clic sur "Analyser avec IA" pour le fichier: {...}`
2. `🎯 ContextMenu: Type compatible: true`
3. `🎯 LeftPanel: Action reçue: analyze_ia pour le fichier: {...}`
4. `🎯 LeftPanel: Événement fileAction dispatché`
5. `🎯 Layout: Événement fileAction reçu: {...}`
6. `🎯 Layout: Action IA détectée pour le fichier: {...}`
7. `🎯 Layout: FileIds à analyser: [...]`

## 📝 Notes
- Le menu contextuel fonctionne uniquement sur les fichiers (pas sur les dossiers)
- La sélection multiple est supportée
- Les analyses sont créées avec le statut "en attente"
- Le lancement se fait manuellement depuis la liste des analyses 