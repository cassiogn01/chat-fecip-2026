@echo off
echo ===============================================
echo  BACKUP DO BANCO DE DADOS USUARIOS.DB (FECIP)
echo ===============================================
set TIMESTAMP=%DATE:/=-%_%TIME::=-%
set TIMESTAMP=%TIMESTAMP: =%
copy backend\usuarios.db backend\backup_usuarios_%TIMESTAMP%.db
echo Backup salvo como backend\backup_usuarios_%TIMESTAMP%.db
pause
