@echo off
REM ============================================================
REM   ALLAZ FIT - atalho para abrir o site no navegador
REM   E so dar dois cliques neste arquivo.
REM   Para desligar o servidor: feche esta janela (ou Ctrl + C).
REM ============================================================

cd /d "%~dp0"
set PORT=4322
set URL=http://localhost:%PORT%

cls
echo.
echo    ALLAZ FIT
echo    ------------------------------------------
echo.

REM Sem Node instalado? Abre o site direto do arquivo.
where node >nul 2>&1
if errorlevel 1 (
  echo    Node.js nao encontrado - abrindo o site direto do arquivo.
  echo    ^(funciona igual; instale o Node em nodejs.org se quiser o servidor local^)
  echo.
  start "" "index.html"
  timeout /t 4 >nul
  exit /b
)

REM Servidor ja ligado? So abre o navegador.
netstat -ano | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo    O servidor ja estava ligado.
  echo    Abrindo %URL%
  echo.
  start "" "%URL%"
  timeout /t 4 >nul
  exit /b
)

echo    Servidor ligado em %URL%
echo    O navegador vai abrir em instantes...
echo.
echo    Para DESLIGAR: feche esta janela ou aperte Ctrl + C
echo    ------------------------------------------
echo.

REM abre o navegador depois de ~2s, sem travar o servidor
start /min "" cmd /c "ping -n 3 127.0.0.1 >nul & start "" %URL%"
node server.js
