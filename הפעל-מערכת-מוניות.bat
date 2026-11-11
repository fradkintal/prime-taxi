@echo off
chcp 65001 >nul
title PRIME TAXI - פריים טקסי (Port 3050)
set "PATH=%USERPROFILE%\scoop\apps\nodejs-lts\current;%USERPROFILE%\scoop\shims;%PATH%"
cd /d "%~dp0"
start "" "http://localhost:3050"
node server.js
pause
