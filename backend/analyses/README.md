# Génération de PDFs pour les Analyses

Ce dossier contient les PDFs générés automatiquement pour toutes les analyses terminées dans DocuSense AI.

## Fonctionnalités

### Génération Automatique
- **Génération automatique** : Un PDF est automatiquement généré pour chaque analyse terminée
- **Stockage organisé** : Les PDFs sont stockés dans ce dossier avec un nommage clair
- **Métadonnées complètes** : Chaque PDF contient toutes les informations de l'analyse

### Contenu des PDFs
Chaque PDF contient :
- **En-tête** : Titre et date de génération
- **Informations sur le fichier** : Nom, type, taille, date de création
- **Paramètres d'analyse** : Type d'analyse, fournisseur IA, modèle utilisé
- **Prompt utilisé** : Le prompt exact utilisé pour l'analyse
- **Résultat de l'analyse** : Le résultat complet de l'analyse IA
- **Métadonnées de traitement** : Temps de traitement, tokens utilisés, coût estimé

### Nommage des Fichiers
Format : `analysis_{ID}_{nom_fichier}_{date_heure}.pdf`

Exemple : `analysis_123_document_test_20241201_143022.pdf`

## API Endpoints

### Génération de PDF
- `POST /api/pdf-files/generate/{analysis_id}` : Générer un PDF pour une analyse spécifique
- `POST /api/pdf-files/generate-all-completed` : Générer des PDFs pour toutes les analyses terminées

### Téléchargement
- `GET /api/pdf-files/download/{analysis_id}` : Télécharger un PDF spécifique
- `GET /api/pdf-files/list` : Lister tous les PDFs disponibles

### Gestion
- `DELETE /api/pdf-files/{analysis_id}` : Supprimer un PDF

## Interface Utilisateur

### Bouton de Téléchargement
- Un bouton de téléchargement PDF apparaît pour chaque analyse terminée
- Icône : DocumentArrowDownIcon (flèche vers le bas)
- Couleur : Couleur primaire de l'interface

### Actions Disponibles
- **Téléchargement direct** : Cliquer sur le bouton PDF pour télécharger
- **Génération à la demande** : Possibilité de régénérer un PDF si nécessaire
- **Suppression** : Supprimer un PDF si plus nécessaire

## Configuration

### Dépendances
- `weasyprint` : Génération de PDFs à partir de HTML (recommandé)
- `reportlab` : Alternative pour la génération de PDFs simples

### Dossier de Stockage
- **Chemin par défaut** : `./analyses/` (relatif au backend)
- **Création automatique** : Le dossier est créé automatiquement si nécessaire
- **Permissions** : Assurez-vous que le dossier est accessible en écriture

## Scripts Utilitaires

### Migration de Base de Données
```bash
cd backend
python migrate_add_pdf_path.py
```

### Génération pour Analyses Existantes
```bash
cd backend
python generate_pdfs_for_existing_analyses.py
```

## Sécurité

### Validation
- Seules les analyses terminées peuvent générer des PDFs
- Vérification de l'existence du fichier avant téléchargement
- Authentification requise pour tous les endpoints

### Accès aux Fichiers
- Les PDFs sont stockés localement sur le serveur
- Accès contrôlé via l'API avec authentification
- Pas d'accès direct aux fichiers sans autorisation

## Dépannage

### Problèmes Courants

1. **PDF non généré**
   - Vérifier que l'analyse est bien terminée
   - Vérifier les permissions du dossier `analyses/`
   - Vérifier l'installation de `weasyprint` ou `reportlab`

2. **Erreur de téléchargement**
   - Vérifier que le PDF existe sur le serveur
   - Vérifier les permissions de lecture du fichier
   - Vérifier la session utilisateur

3. **PDF vide ou corrompu**
   - Vérifier que l'analyse a un résultat valide
   - Vérifier l'installation des dépendances PDF
   - Consulter les logs du serveur

### Logs
Les erreurs de génération de PDF sont loggées dans les logs du serveur avec le niveau `ERROR`.

## Maintenance

### Nettoyage
- Les PDFs peuvent être supprimés via l'API
- Considérer un nettoyage automatique des anciens PDFs
- Surveiller l'espace disque utilisé

### Sauvegarde
- Les PDFs sont des fichiers générés, pas des données critiques
- La régénération est toujours possible
- Inclure le dossier dans les sauvegardes si nécessaire
