@echo off
echo =========================================================
echo   EXPOSICAO PUBLICA VIA CLOUDFLARE TUNNEL (DIA DA FEIRA)
echo =========================================================
echo Expondo http://localhost:3000 para a Internet gratuitamente...
echo.
npx --yes cloudflared tunnel --url http://localhost:3000
pause
