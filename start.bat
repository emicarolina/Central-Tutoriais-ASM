@echo off
chcp 65001 >nul
title Central de Tutoriais — Agora Sou Mãe
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Central de Tutoriais — Agora Sou Mãe
echo  ==========================================
echo.

:: Verifica se o Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERRO: Python não encontrado.
  echo.
  pause
  exit /b
)

:: Cria o ambiente virtual se ainda não existir
if not exist "venv\" (
  echo  Configurando o sistema pela primeira vez...
  echo  Isso pode levar alguns minutos. Aguarde.
  echo.
  python -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements.txt --quiet
  echo  Configuração concluída!
  echo.
) else (
  call venv\Scripts\activate.bat
)

:: Inicia o servidor Flask em background
echo  Iniciando servidor...
start /B python app.py

:: Aguarda o servidor subir e abre o navegador
timeout /t 3 /nobreak >nul
start http://localhost:5000

echo  Sistema iniciado! Acesse http://localhost:5000
echo.
echo  Mantenha esta janela aberta enquanto estiver usando.
echo  Para encerrar o sistema, feche esta janela.
echo.
pause