# Script de Backup do Banco de Dados SQLite (Checklist Técnico)
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$source = "backend/usuarios.db"
$dest = "backend/backup_usuarios_$timestamp.db"

if (Test-Path $source) {
    Copy-Item $source $dest
    Write-Host "✅ Backup concluído com sucesso: $dest" -ForegroundColor Green
} else {
    Write-Host "⚠️ Arquivo $source ainda não foi criado." -ForegroundColor Yellow
}
