@echo off
title Servidor Control de Activos POS
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor_local.ps1"
pause

