# Script d'aide pour DocuSense AI
# Affiche les options disponibles

Write-Host "🚀 DocuSense AI - Guide d'utilisation" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 COMMANDES DISPONIBLES:" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 DÉMARRAGE:" -ForegroundColor Yellow
Write-Host "  .\start.ps1                    # Mode INTÉGRÉ (recommandé pour Cursor)" -ForegroundColor White
Write-Host "  .\start.ps1 -External         # Mode EXTERNE (terminaux séparés)" -ForegroundColor White
Write-Host "  .\start.ps1 -KillOnly         # Arrêt uniquement" -ForegroundColor White
Write-Host ""

Write-Host "🛑 ARRÊT:" -ForegroundColor Yellow
Write-Host "  .\stop.ps1                    # Arrêt complet des services" -ForegroundColor White
Write-Host ""

Write-Host "📊 MODES DE FONCTIONNEMENT:" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 MODE INTÉGRÉ (par défaut):" -ForegroundColor Cyan
Write-Host "  ✅ Services dans le terminal actuel" -ForegroundColor Green
Write-Host "  ✅ Recommandé pour Cursor" -ForegroundColor Green
Write-Host "  ✅ Pas de fenêtres externes" -ForegroundColor Green
Write-Host "  ✅ Gestion via jobs PowerShell" -ForegroundColor Green
Write-Host "  ⚠️  Logs moins visibles" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 MODE EXTERNE (-External):" -ForegroundColor Cyan
Write-Host "  ✅ Terminaux séparés pour chaque service" -ForegroundColor Green
Write-Host "  ✅ Logs visibles en temps réel" -ForegroundColor Green
Write-Host "  ✅ Débogage facilité" -ForegroundColor Green
Write-Host "  ⚠️  Plus de fenêtres ouvertes" -ForegroundColor Yellow
Write-Host "  ⚠️  Gestion manuelle des terminaux" -ForegroundColor Yellow
Write-Host ""

Write-Host "🛠️  GESTION DES JOBS (Mode intégré):" -ForegroundColor Yellow
Write-Host "  Get-Job                          # Voir les jobs actifs" -ForegroundColor White
Write-Host "  Receive-Job <JobId>             # Voir les logs d'un job" -ForegroundColor White
Write-Host "  Stop-Job <JobId>                # Arrêter un job spécifique" -ForegroundColor White
Write-Host "  Remove-Job <JobId>              # Supprimer un job" -ForegroundColor White
Write-Host ""

Write-Host "🌐 PORTS UTILISÉS:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "💡 CONSEILS:" -ForegroundColor Yellow
Write-Host "  • Utilisez le mode INTÉGRÉ pour le développement quotidien" -ForegroundColor White
Write-Host "  • Utilisez le mode EXTERNE pour le débogage" -ForegroundColor White
Write-Host "  • Les logs détaillés sont disponibles dans l'onglet Logs de l'application" -ForegroundColor White
Write-Host "  • Relancez le script pour redémarrer les services" -ForegroundColor White
Write-Host ""

Write-Host "🎯 EXEMPLES D'UTILISATION:" -ForegroundColor Yellow
Write-Host "  # Démarrage normal (mode intégré)" -ForegroundColor White
Write-Host "  .\start.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Démarrage avec terminaux séparés" -ForegroundColor White
Write-Host "  .\start.ps1 -External" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Arrêt complet" -ForegroundColor White
Write-Host "  .\stop.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Gray
Write-Host "🎉 DocuSense AI - Prêt pour le développement!" -ForegroundColor Green
