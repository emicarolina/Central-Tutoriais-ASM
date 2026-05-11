@echo off
chcp 65001 >nul
title Atualizando Central de Tutoriais
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Atualizando Central de Tutoriais...
echo  ==========================================
echo.

:: Verifica se o Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERRO: Git não encontrado nesta máquina.
  echo.
  pause
  exit /b
)

:: Baixa as atualizações do GitHub
echo  Baixando atualizações...
git pull origin main

:: Atualiza dependências se o requirements.txt mudou
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

echo.
echo  Sistema atualizado com sucesso!
echo  Abra o start.bat para usar o sistema.
echo.
pause