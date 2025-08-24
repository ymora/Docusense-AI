# 📦 Archives des Logs - DocuSense AI

## 📋 Description

Ce répertoire contient les logs archivés et compressés de DocuSense AI. Les logs sont automatiquement archivés après 30 jours et supprimés après 1 an.

## 🗂️ Structure des archives

```
archive/
├── YYYY-MM/              # Archives par mois
│   ├── application/      # Logs d'application archivés
│   ├── security/         # Logs de sécurité archivés
│   ├── api/             # Logs d'API archivés
│   ├── database/        # Logs de base de données archivés
│   ├── system/          # Logs système archivés
│   ├── analysis/        # Logs d'analyse archivés
│   └── frontend/        # Logs frontend archivés
└── README.md            # Ce fichier
```

## 🔧 Format des archives

- **Format** : `.tar.gz` (compression gzip)
- **Nommage** : `YYYY-MM-DD_category.tar.gz`
- **Taille max** : 100MB par archive
- **Rétention** : 1 an maximum

## 📊 Statistiques

- **Fréquence d'archivage** : Quotidienne
- **Compression** : ~70% de réduction de taille
- **Vérification d'intégrité** : Checksum SHA256

## 🚀 Restauration

Pour restaurer des logs archivés :

```bash
# Extraire une archive
tar -xzf YYYY-MM-DD_application.tar.gz

# Vérifier l'intégrité
sha256sum -c YYYY-MM-DD_application.tar.gz.sha256
```

## 🔒 Sécurité

- Les archives sont chiffrées avec AES-256
- Accès restreint aux administrateurs uniquement
- Sauvegarde sécurisée sur serveur distant
- Rotation des clés de chiffrement

## 📈 Monitoring

- Taille totale des archives
- Nombre d'archives par mois
- Espace disque utilisé
- Intégrité des archives

## 🗑️ Nettoyage automatique

- Suppression des archives > 1 an
- Nettoyage des archives corrompues
- Optimisation de l'espace disque
- Rapport de nettoyage mensuel
