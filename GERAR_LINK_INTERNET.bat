@echo off
chcp 65001 >nul
title MT CARS - Gerador de Link Publico na Internet (HTTPS)
echo ======================================================================
echo   MT CARS - GERANDO LINK PUBLICO NA INTERNET (ACESSO DE QUALQUER LUGAR)
echo   Copie o link https://....app.lhr.life que aparecer abaixo!
echo ======================================================================
:loop
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=20 -R 80:localhost:3000 nokey@localhost.run
echo Reconectando tunel automaticamente em 2 segundos...
timeout /t 2 >nul
goto loop
