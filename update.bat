@echo off
chcp 65001 >nul
title Atualizando Central de Tutoriais — Agora Sou Mãe
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Atualizando Central de Tutoriais — Agora Sou Mãe
echo  ==========================================
echo.

echo  Feche o sistema antes de atualizar.
echo  Se ele estiver aberto, feche a janela do start.bat.
echo.

:: Verifica se o Git está instalado
echo  Verificando Git...
git --version >nul 2>&1

if errorlevel 1 (
  echo.
  echo  ERRO: Git não encontrado nesta máquina.
  echo.
  pause
  exit /b
)

:: Verifica se o Python está instalado
echo  Verificando Python...
python --version >nul 2>&1

if errorlevel 1 (
  echo.
  echo  ERRO: Python não encontrado.
  echo.
  pause
  exit /b
)

:: Verifica se esta pasta é um repositório Git
if not exist ".git\" (
  echo.
  echo  ERRO: Esta pasta não parece ser um repositório Git.
  echo.
  pause
  exit /b
)

:: Baixa as atualizações
echo.
echo  Baixando atualizações...

git pull

if errorlevel 1 (
  echo.
  echo  ERRO: Não foi possível atualizar os arquivos.
  echo.
  pause
  exit /b
)

:: Cria o ambiente virtual se não existir
if not exist "venv\" (
  echo.
  echo  Criando ambiente virtual...

  python -m venv venv

  if errorlevel 1 (
    echo.
    echo  ERRO: Não foi possível criar o ambiente virtual.
    echo.
    pause
    exit /b
  )
)

:: Atualiza dependências
echo.
echo  Atualizando dependências...

venv\Scripts\python.exe -m pip install -q --upgrade pip
venv\Scripts\python.exe -m pip install -q -r requirements.txt

if errorlevel 1 (
  echo.
  echo  ERRO: Falha ao atualizar as dependências.
  echo.
  pause
  exit /b
)

echo.
echo  Sistema atualizado com sucesso!
echo  Agora abra o start.bat para usar o sistema.
echo.

pause