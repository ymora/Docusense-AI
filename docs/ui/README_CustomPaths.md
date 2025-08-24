# 🗂️ Chemins Personnalisés - DocuSense AI

## 📋 Vue d'ensemble

La fonctionnalité **Chemins Personnalisés** permet aux utilisateurs d'ajouter et de gérer des dossiers personnalisés pour l'analyse de documents, en plus des disques locaux détectés automatiquement.

## 🎯 Objectifs

- **Flexibilité** : Accéder à des dossiers réseau, serveurs, ou chemins personnalisés
- **Simplicité** : Interface intuitive pour ajouter/supprimer des chemins
- **Persistance** : Sauvegarde automatique des chemins dans le navigateur
- **Validation** : Test automatique de l'accessibilité des chemins

## 🚀 Fonctionnalités

### Types de Chemins Supportés

1. **📁 Local** - Dossiers locaux personnalisés
2. **🖥️ Réseau** - Partages réseau (SMB, NFS)
3. **🖥️ Serveur** - Serveurs de fichiers
4. **☁️ Cloud** - Dossiers cloud montés localement

### Exemples de Chemins

#### Windows
```
C:\Users\Documents\Projets
\\serveur\partage\documents
\\192.168.1.100\shared\contracts
```

#### Linux/Mac
```
/home/user/documents
/mnt/share/documents
/media/user/external
```

## 🎮 Utilisation

### Ajouter un Chemin Personnalisé

1. **Ouvrir le sélecteur de disque** dans le panneau gauche
2. **Cliquer sur "Ajouter un chemin"**
3. **Remplir le formulaire** :
   - **Type** : Sélectionner le type de chemin
   - **Nom** : Nom d'affichage (ex: "Serveur Documents")
   - **Chemin** : Chemin complet vers le dossier
4. **Cliquer sur "Ajouter"**

### Gérer les Chemins

- **Sélectionner** : Cliquer sur un chemin pour l'utiliser
- **Supprimer** : Cliquer sur l'icône ❌ à côté du chemin
- **Modifier** : Supprimer et rajouter avec les nouvelles informations

## 🔧 Fonctionnement Technique

### Stockage
- **localStorage** : Sauvegarde automatique dans le navigateur
- **Persistance** : Les chemins restent disponibles après redémarrage
- **Sécurité** : Pas de transmission au serveur, stockage local uniquement

### Validation
- **Test d'accessibilité** : Vérification automatique avant ajout
- **Gestion d'erreurs** : Messages d'erreur informatifs
- **Retry automatique** : Possibilité de réessayer en cas d'échec

### Interface
- **Icônes distinctives** : Chaque type de chemin a son icône
- **Statut visuel** : Indicateurs d'état (en ligne/hors ligne)
- **Organisation** : Séparation claire entre disques locaux et chemins personnalisés

## 🎨 Interface Utilisateur

### Sélecteur de Disque Amélioré

```
┌─────────────────────────────────────┐
│ 📁 Sélectionner un disque           │
└─────────────────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Disques locaux                      │
│ ┌─────────────────────────────────┐ │
│ │ 📁 C:                           │ │
│ │ 📁 D:                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Chemins personnalisés               │
│ ┌─────────────────────────────────┐ │
│ │ 🖥️ Serveur Documents            │ │
│ │   \\serveur\partage\docs    ❌  │ │
│ │ ☁️ Cloud Storage                │ │
│ │   /mnt/cloud/documents      ❌  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ➕ Ajouter un chemin                │
└─────────────────────────────────────┘
```

### Formulaire d'Ajout

```
┌─────────────────────────────────────┐
│ Nouveau chemin                      │
│                                     │
│ Type: [Local ▼]                     │
│ Nom: [Serveur Documents]            │
│ Chemin: [\\serveur\partage]         │
│                                     │
│ [Ajouter] [Annuler]                 │
└─────────────────────────────────────┘
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Permissions** : S'assurer d'avoir les droits d'accès
2. **Réseau** : Vérifier la connectivité réseau
3. **Authentification** : Configurer les identifiants si nécessaire
4. **Firewall** : Autoriser les connexions réseau

### Limitations

- **Accès local uniquement** : L'application doit pouvoir accéder au chemin
- **Permissions système** : Respect des droits d'accès du système
- **Réseau** : Dépend de la connectivité réseau pour les chemins distants

## 🛠️ Dépannage

### Problèmes Courants

#### "Impossible d'accéder au chemin"
- **Vérifier** : Le chemin existe et est accessible
- **Permissions** : Droits d'accès suffisants
- **Réseau** : Connectivité pour les chemins distants

#### "Chemin invalide"
- **Format** : Vérifier la syntaxe du chemin
- **Caractères** : Éviter les caractères spéciaux
- **Longueur** : Respecter les limites du système

#### "Erreur de connexion"
- **Serveur** : Vérifier que l'application est démarrée
- **Réseau** : Tester la connectivité
- **Firewall** : Autoriser les connexions

### Solutions

1. **Redémarrer l'application** : Recharger les services
2. **Vérifier les permissions** : Droits d'accès système
3. **Tester manuellement** : Accéder au chemin via l'explorateur
4. **Contacter l'admin** : Pour les problèmes réseau

## 📈 Améliorations Futures

### Fonctionnalités Prévues

1. **Synchronisation cloud** : Sauvegarde des chemins en ligne
2. **Gestion des identifiants** : Stockage sécurisé des mots de passe
3. **Monitoring** : Surveillance de l'état des chemins
4. **Import/Export** : Sauvegarde et restauration des configurations
5. **Favoris** : Chemins fréquemment utilisés

### Optimisations

1. **Cache intelligent** : Mise en cache des listes de fichiers
2. **Connexions persistantes** : Réutilisation des connexions réseau
3. **Compression** : Optimisation des transferts
4. **Parallélisation** : Accès simultané à plusieurs chemins

---

*Dernière mise à jour : Août 2025*
