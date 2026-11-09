@echo off
title Servidor HTTPS Seguro - Activos POS
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor_https.ps1"
pause
