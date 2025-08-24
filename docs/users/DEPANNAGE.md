# 🐛 Dépannage - DocuSense AI

## 🚨 Problèmes Critiques

### ❌ Problèmes Courants

#### **Environnement Virtuel Manquant**
```powershell
# Solution automatique
.\docusense.ps1 cleanup

# Solution manuelle
cd backend
python -m venv venv
venv\Scripts\activate
venv\Scripts\pip.exe install -r requirements.txt
```

#### **Ports Déjà Utilisés**
```powershell
# Solution automatique
.\docusense.ps1 restart

# Solution manuelle
taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
```

#### **Base de Données Corrompue**
```powershell
# Diagnostic
.\docusense.ps1 status

# Optimisation automatique
.\docusense.ps1 cleanup
```

#### **Lecteur Vidéo Ne Fonctionne Pas**
```bash
# Vérifier les dépendances multimédia
cd backend
venv\Scripts\pip.exe install ffmpeg-python av pytube yt-dlp

# Vérifier FFmpeg
ffmpeg -version

# Tester le streaming
curl http://localhost:8000/api/files/stream-by-path/[chemin_fichier]
```

## 🤖 Problèmes d'Analyse IA

### **Analyse IA Ne Fonctionne Pas**
1. **Vérifiez la configuration** : Bouton ⚙️ → Ajoutez vos clés API
2. **Testez les providers** : Utilisez le bouton "Tester" pour chaque provider
3. **Vérifiez les quotas** : Certains providers ont des limites d'usage
4. **Consultez les logs** : Vérifiez les erreurs dans la console

### **Erreurs de Provider IA**
```bash
# Vérifier les clés API
curl -X POST "http://localhost:8000/api/config/test" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "api_key": "your-key"}'

# Vérifier les logs backend
tail -f backend/logs/docusense_error.log
```

### **Queue d'Analyses Bloquée**
```bash
# Redémarrer le service d'analyses
curl -X POST "http://localhost:8000/api/analysis/restart-queue"

# Vider la queue
curl -X DELETE "http://localhost:8000/api/analysis/clear-queue"
```

## 📁 Problèmes de Fichiers

### **Fichiers Ne S'affichent Pas**
1. **Vérifiez le format** : Seuls les formats supportés sont affichables
2. **Vérifiez les permissions** : Le fichier doit être accessible
3. **Vérifiez la taille** : Les fichiers trop volumineux peuvent être lents
4. **Actualisez la page** : Parfois nécessaire après un changement

### **Erreurs de Streaming**
```bash
# Tester le streaming d'un fichier
curl -I "http://localhost:8000/api/files/stream-by-path/[chemin_fichier]"

# Vérifier les logs de streaming
grep "stream" backend/logs/docusense.log
```

### **Problèmes de Sélection de Disque**
```bash
# Vérifier les permissions de lecture
ls -la /chemin/vers/disque

# Tester l'API de listage
curl "http://localhost:8000/api/files/drives"
```

## 🔐 Problèmes d'Authentification

### **Connexion Impossible**
1. **Vérifiez les credentials** : Nom d'utilisateur et mot de passe
2. **Vérifiez le rôle** : Assurez-vous d'avoir les bonnes permissions
3. **Vérifiez les logs** : Erreurs d'authentification dans les logs

### **Token JWT Expiré**
```bash
# Vérifier la validité du token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/auth/verify"

# Renouveler le token
curl -X POST "http://localhost:8000/api/auth/refresh" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### **Problèmes de Permissions**
```bash
# Vérifier les permissions utilisateur
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/auth/me"

# Vérifier les rôles
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/auth/roles"
```

## 🌐 Problèmes de Réseau

### **Backend Hors Ligne**
```bash
# Vérifier le statut du backend
curl http://localhost:8000/health

# Vérifier les processus
netstat -an | findstr :8000

# Redémarrer le backend
cd backend
python main.py
```

### **Frontend Ne Se Connecte Pas**
```bash
# Vérifier le statut du frontend
curl http://localhost:3000

# Vérifier les processus
netstat -an | findstr :3000

# Redémarrer le frontend
cd frontend
npm run dev
```

### **Problèmes CORS**
```bash
# Vérifier la configuration CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:8000/api/files/drives
```

## 📊 Diagnostic et Logs

### **Logs Importants**
- **Logs backend** : `backend/logs/docusense.log`
- **Logs d'erreur** : `backend/logs/docusense_error.log`
- **Logs de surveillance** : `logs/monitoring_YYYYMMDD.log`
- **Rapports de diagnostic** : `logs/diagnostic_YYYYMMDD_HHMMSS.txt`

### **Commandes de Diagnostic**
```bash
# Vérifier l'état général
.\docusense.ps1 status

# Diagnostic complet
.\docusense.ps1 diagnose

# Surveillance en temps réel
.\docusense.ps1 monitor

# Nettoyage et optimisation
.\docusense.ps1 cleanup
```

### **Vérification des Services**
```bash
# Vérifier le backend
curl http://localhost:8000/health

# Vérifier la base de données
curl http://localhost:8000/api/health/database

# Vérifier les providers IA
curl http://localhost:8000/api/config/providers
```

## 🔧 Outils de Diagnostic

### **Scripts de Diagnostic**
```powershell
# Diagnostic automatique
.\docusense.ps1 status

# Optimisation automatique
.\docusense.ps1 cleanup

# Surveillance continue
.\docusense.ps1 monitor

# Tests automatiques
.\docusense.ps1 test
```

### **Tests de Performance**
```bash
# Test de charge backend
cd backend
python -m pytest tests/test_performance.py

# Test de charge frontend
cd frontend
npm run test:performance
```

### **Vérification de l'Installation**
```bash
# Vérifier les dépendances
cd backend
venv\Scripts\pip.exe list

cd frontend
npm list

# Vérifier les versions
python --version
node --version
npm --version
```

## 📞 Support et Contact

### **Documentation**
- **API Docs** : http://localhost:8000/docs
- **README** : Documentation complète du projet
- **Scripts** : Aide intégrée avec `-h` ou `--help`

### **Outils de Diagnostic**
- **Diagnostic automatique** : `.\docusense.ps1 status`
- **Optimisation automatique** : `.\docusense.ps1 cleanup`
- **Surveillance continue** : `.\docusense.ps1 monitor`

### **Contact**
- **Issues** : Utiliser GitHub Issues pour les bugs et demandes
- **Discussions** : GitHub Discussions pour les questions générales
- **Wiki** : Documentation détaillée et guides

## 🚨 Problèmes Urgents

### **Application Ne Démarre Pas**
1. **Vérifiez les prérequis** : Python 3.8+, Node.js 16+
2. **Vérifiez les ports** : 3000 et 8000 disponibles
3. **Vérifiez les permissions** : Droits d'écriture dans le dossier
4. **Consultez les logs** : Erreurs de démarrage

### **Base de Données Corrompue**
```bash
# Sauvegarde automatique
.\docusense.ps1 backup

# Restauration
.\docusense.ps1 restore

# Réinitialisation complète
.\docusense.ps1 reset
```

### **Perte de Données**
```bash
# Récupération automatique
.\docusense.ps1 recover

# Restauration depuis sauvegarde
.\docusense.ps1 restore --backup=YYYYMMDD_HHMMSS
```

---

*Dernière mise à jour : Août 2025 - Dépannage v2.0*
