@echo off
chcp 65001 >nul
title MT CARS - Servidor + Banco de Dados em Tempo Real
echo ======================================================================
echo   MT CARS - PORTAL ESTADUAL DE INTERMEDIACAO DE VEICULOS (MATO GROSSO)
echo   Iniciando Banco de Dados Local + Servidor Realtime na Porta 3000...
echo ======================================================================
cd /d "%~dp0"
start "" "http://localhost:3000"
start "" "http://localhost:3000/?view=admin"
node "%~dp0server.js"
pause
