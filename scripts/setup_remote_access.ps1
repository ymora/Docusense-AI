# Script de configuration de l'accès distant pour DocuSense AI
# Ce script configure l'accès distant sécurisé avec authentification

param(
    [string]$Password = "",
    [switch]$ShowHelp = $false,
    [switch]$ChangePassword = $false,
    [switch]$ShowStatus = $false
)

Write-Host "🔐 Configuration de l'Accès Distant - DocuSense AI" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($ShowHelp) {
    Write-Host "`n📖 Utilisation :" -ForegroundColor Yellow
    Write-Host "   .\scripts\setup_remote_access.ps1" -ForegroundColor White
    Write-Host "   .\scripts\setup_remote_access.ps1 -Password 'votre_mot_de_passe'" -ForegroundColor White
    Write-Host "   .\scripts\setup_remote_access.ps1 -ChangePassword" -ForegroundColor White
    Write-Host "   .\scripts\setup_remote_access.ps1 -ShowStatus" -ForegroundColor White
    Write-Host "   .\scripts\setup_remote_access.ps1 -ShowHelp" -ForegroundColor White
    
    Write-Host "`n🎯 Options :" -ForegroundColor Yellow
    Write-Host "   -Password 'mot_de_passe' : Définir le mot de passe administrateur" -ForegroundColor White
    Write-Host "   -ChangePassword : Changer le mot de passe existant" -ForegroundColor White
    Write-Host "   -ShowStatus : Afficher le statut de l'authentification" -ForegroundColor White
    Write-Host "   -ShowHelp : Afficher cette aide" -ForegroundColor White
    
    Write-Host "`n🌐 Accès distant :" -ForegroundColor Yellow
    Write-Host "   Interface web : http://localhost:8000/remote" -ForegroundColor White
    Write-Host "   API docs : http://localhost:8000/docs#authentication" -ForegroundColor White
    Write-Host "   Mot de passe par défaut : admin123" -ForegroundColor White
    
    exit 0
}

# Vérifier que le backend est en cours d'exécution
Write-Host "`n🔍 Vérification du backend..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/status" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend non accessible. Assurez-vous qu'il est démarré :" -ForegroundColor Red
    Write-Host "   cd backend && venv\Scripts\python.exe main.py" -ForegroundColor White
    exit 1
}

# Fonction pour obtenir le mot de passe de manière sécurisée
function Get-SecurePassword {
    param([string]$Prompt = "Entrez le mot de passe")
    
    $securePassword = Read-Host -Prompt $Prompt -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Fonction pour changer le mot de passe
function Set-AdminPassword {
    param([string]$NewPassword)
    
    try {
        # D'abord, se connecter avec l'ancien mot de passe
        Write-Host "`n🔐 Connexion avec l'ancien mot de passe..." -ForegroundColor Yellow
        $oldPassword = Get-SecurePassword -Prompt "Ancien mot de passe"
        
        $loginBody = @{
            password = $oldPassword
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        
        if ($loginResponse.success) {
            $sessionToken = $loginResponse.session_token
            
            # Changer le mot de passe
            Write-Host "🔄 Changement du mot de passe..." -ForegroundColor Yellow
            $changePasswordBody = @{
                old_password = $oldPassword
                new_password = $NewPassword
            } | ConvertTo-Json
            
            $changeResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/change-password" -Method POST -Body $changePasswordBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer $sessionToken"}
            
            if ($changeResponse.success) {
                Write-Host "✅ Mot de passe changé avec succès !" -ForegroundColor Green
            } else {
                Write-Host "❌ Erreur lors du changement de mot de passe : $($changeResponse.message)" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Ancien mot de passe incorrect" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erreur lors du changement de mot de passe : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Fonction pour afficher le statut
function Show-AuthStatus {
    try {
        $status = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/status" -Method GET
        
        Write-Host "`n📊 Statut de l'Authentification :" -ForegroundColor Yellow
        Write-Host "   Authentification activée : $($status.authentication_enabled)" -ForegroundColor White
        Write-Host "   Timeout de session : $($status.session_timeout_seconds) secondes" -ForegroundColor White
        Write-Host "   Tentatives max : $($status.max_login_attempts)" -ForegroundColor White
        Write-Host "   Durée de verrouillage : $($status.lockout_duration_seconds) secondes" -ForegroundColor White
        Write-Host "   Sessions actives : $($status.active_sessions_count)" -ForegroundColor White
        
        Write-Host "`n🌐 Accès :" -ForegroundColor Yellow
        Write-Host "   Interface web : http://localhost:8000/remote" -ForegroundColor White
        Write-Host "   API docs : http://localhost:8000/docs#authentication" -ForegroundColor White
        
    } catch {
        Write-Host "❌ Erreur lors de la récupération du statut : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Traitement des options
if ($ShowStatus) {
    Show-AuthStatus
    exit 0
}

if ($ChangePassword) {
    if ([string]::IsNullOrEmpty($Password)) {
        $Password = Get-SecurePassword -Prompt "Nouveau mot de passe"
    }
    Set-AdminPassword -NewPassword $Password
    exit 0
}

# Configuration initiale
if ([string]::IsNullOrEmpty($Password)) {
    Write-Host "`n🔐 Configuration du mot de passe administrateur :" -ForegroundColor Yellow
    Write-Host "   Le mot de passe par défaut est 'admin123'" -ForegroundColor White
    Write-Host "   Voulez-vous le changer ? (O/N)" -ForegroundColor White
    
    $response = Read-Host
    if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
        $Password = Get-SecurePassword -Prompt "Nouveau mot de passe"
        Set-AdminPassword -NewPassword $Password
    } else {
        Write-Host "✅ Mot de passe par défaut conservé : admin123" -ForegroundColor Green
    }
} else {
    Set-AdminPassword -NewPassword $Password
}

# Affichage des informations d'accès
Write-Host "`n🎉 Configuration terminée !" -ForegroundColor Green
Write-Host "`n🌐 Accès distant disponible :" -ForegroundColor Yellow
Write-Host "   Interface web : http://localhost:8000/remote" -ForegroundColor White
Write-Host "   API docs : http://localhost:8000/docs#authentication" -ForegroundColor White
Write-Host "   API docs : http://localhost:8000/docs#download" -ForegroundColor White

Write-Host "`n📋 Fonctionnalités disponibles :" -ForegroundColor Yellow
Write-Host "   ✅ Authentification sécurisée" -ForegroundColor Green
Write-Host "   ✅ Navigation des fichiers" -ForegroundColor Green
Write-Host "   ✅ Téléchargement de fichiers individuels" -ForegroundColor Green
Write-Host "   ✅ Téléchargement de dossiers (ZIP)" -ForegroundColor Green
Write-Host "   ✅ Téléchargement multiple (ZIP)" -ForegroundColor Green
Write-Host "   ✅ Gestion des sessions" -ForegroundColor Green

Write-Host "`n🔒 Sécurité :" -ForegroundColor Yellow
Write-Host "   • Sessions avec timeout automatique" -ForegroundColor White
Write-Host "   • Protection contre les attaques par force brute" -ForegroundColor White
Write-Host "   • Nettoyage automatique des sessions expirées" -ForegroundColor White
Write-Host "   • Limitation de la taille des fichiers (1 GB max)" -ForegroundColor White
Write-Host "   • Limitation de la taille des ZIP (5 GB max)" -ForegroundColor White

Write-Host "`n💡 Commandes utiles :" -ForegroundColor Yellow
Write-Host "   .\scripts\setup_remote_access.ps1 -ShowStatus" -ForegroundColor White
Write-Host "   .\scripts\setup_remote_access.ps1 -ChangePassword" -ForegroundColor White
Write-Host "   .\scripts\setup_remote_access.ps1 -ShowHelp" -ForegroundColor White

Write-Host "`n🚀 Pour démarrer l'accès distant :" -ForegroundColor Yellow
Write-Host "   Ouvrez votre navigateur et allez sur : http://localhost:8000/remote" -ForegroundColor White 