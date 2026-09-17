@echo off
echo =========================================================
echo   INICIANDO CHAT COM TRADUCAO SIMULTANEA (FECIP 2026)
echo   Lema: "Entra, conversa, traduz, tchau"
echo =========================================================
echo Verificando se o LibreTranslate esta rodando...
curl -s http://localhost:5000/languages > nul
if %errorlevel% neq 0 (
    echo Iniciando LibreTranslate via Docker...
    docker compose up -d
    echo Aguardando LibreTranslate inicializar...
    timeout /t 5 /nobreak > nul
) else (
    echo LibreTranslate ja esta ativo na porta 5000!
)

echo.
echo Iniciando servidor Node.js...
cd backend
npm start
pause
