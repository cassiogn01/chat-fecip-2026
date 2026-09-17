# Script PowerShell para Inicializar o Projeto FECIP 2026
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   INICIANDO CHAT COM TRADUÇÃO SIMULTÂNEA (FECIP 2026)   " -ForegroundColor Cyan
Write-Host "   Lema: 'Entra, conversa, traduz, tchau'                 " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Testa conexão com LibreTranslate
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5000/languages" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ LibreTranslate está ativo na porta 5000 com $($res.Count) idiomas!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ LibreTranslate não respondeu. Subindo via docker compose..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 5
}

Write-Host "🚀 Iniciando Servidor Node.js + Express + Socket.io..." -ForegroundColor Green
Set-Location "$PSScriptRoot/backend"
npm start
