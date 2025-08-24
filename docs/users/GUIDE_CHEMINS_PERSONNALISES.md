# 🗂️ Guide Utilisateur - Chemins Personnalisés

## 🎯 Comment Ajouter vos Dossiers Personnalisés

### Étape 1 : Ouvrir le Sélecteur
1. Dans le panneau gauche de l'application
2. Cliquer sur **"Sélectionner un disque"**
3. Cliquer sur **"Ajouter un chemin"**

### Étape 2 : Remplir le Formulaire
- **Type** : Choisir le type de dossier
  - 📁 **Local** : Dossier sur votre ordinateur
  - 🖥️ **Réseau** : Dossier partagé sur le réseau
  - 🖥️ **Serveur** : Dossier sur un serveur
  - ☁️ **Cloud** : Dossier cloud monté localement

- **Nom** : Donner un nom facile à reconnaître
  - Exemple : "Documents Projets" ou "Serveur Entreprise"

- **Chemin** : Le chemin complet vers le dossier
  - Windows : `C:\Users\Documents\Projets` ou `\\serveur\partage`
  - Linux/Mac : `/home/user/documents` ou `/mnt/share`

### Étape 3 : Valider
- Cliquer sur **"Ajouter"**
- Le dossier sera testé automatiquement
- Si accessible, il apparaîtra dans la liste

## 💡 Exemples Pratiques

### Dossier Local Windows
```
Type: Local
Nom: Mes Documents
Chemin: C:\Users\VotreNom\Documents
```

### Partage Réseau Windows
```
Type: Réseau
Nom: Serveur Documents
Chemin: \\192.168.1.100\partage\documents
```

### Dossier Linux/Mac
```
Type: Local
Nom: Documents Personnels
Chemin: /home/utilisateur/documents
```

### Dossier Cloud Monté
```
Type: Cloud
Nom: Google Drive
Chemin: /mnt/google-drive
```

## 🔧 Gestion des Chemins

### Modifier un Chemin
1. **Supprimer** le chemin existant (icône ❌)
2. **Rajouter** avec les nouvelles informations

### Supprimer un Chemin
- Cliquer sur l'icône **❌** à côté du chemin
- Confirmation automatique

### Utiliser un Chemin
- **Cliquer** sur le nom du chemin dans la liste
- L'application naviguera automatiquement vers ce dossier

## ⚠️ Problèmes Courants

### "Impossible d'accéder au chemin"
- ✅ Vérifier que le dossier existe
- ✅ Vérifier les permissions d'accès
- ✅ Pour les réseaux : vérifier la connectivité

### "Chemin invalide"
- ✅ Vérifier la syntaxe du chemin
- ✅ Utiliser des barres obliques correctes
- ✅ Éviter les caractères spéciaux

### "Erreur de connexion"
- ✅ Vérifier que l'application est démarrée
- ✅ Vérifier la connexion réseau
- ✅ Contacter l'administrateur réseau

## 🎯 Conseils d'Utilisation

### Organisation
- **Nommer clairement** vos chemins pour les retrouver facilement
- **Grouper** les chemins par projet ou service
- **Supprimer** les chemins inutilisés

### Performance
- **Privilégier** les chemins locaux pour de meilleures performances
- **Éviter** trop de chemins réseau simultanés
- **Tester** l'accessibilité avant l'analyse

### Sécurité
- **Vérifier** les permissions avant d'ajouter un chemin
- **Ne pas partager** les chemins sensibles
- **Utiliser** des identifiants sécurisés pour les réseaux

## 🆘 Besoin d'Aide ?

### Support Technique
- **Logs** : Vérifier les logs dans le panneau d'administration
- **Statut** : Contrôler le statut de l'application
- **Réseau** : Tester la connectivité réseau

### Contact
- **Administrateur** : Pour les problèmes de permissions
- **Support** : Pour les problèmes techniques
- **Documentation** : Consulter la documentation complète

---

*Guide créé pour DocuSense AI - Août 2025*
