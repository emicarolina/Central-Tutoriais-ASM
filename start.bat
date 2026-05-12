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
echo  Verificando Python...
python --version >nul 2>&1

if errorlevel 1 (
  echo.
  echo  ERRO: Python não encontrado.
  echo.
  pause
  exit /b
)

:: Cria o ambiente virtual se não existir
if not exist "venv\" (
  echo.
  echo  Configurando o sistema pela primeira vez...
  echo  Isso pode levar alguns minutos. Aguarde.
  echo.

  python -m venv venv

  if errorlevel 1 (
    echo.
    echo  ERRO: Não foi possível criar o ambiente virtual.
    echo.
    pause
    exit /b
  )
)

:: Instala/verifica dependências
echo.
echo  Instalando/verificando dependências...

venv\Scripts\python.exe -m pip install -q --upgrade pip
venv\Scripts\python.exe -m pip install -q -r requirements.txt

if errorlevel 1 (
  echo.
  echo  ERRO: Falha ao instalar as dependências.
  echo  Verifique o arquivo requirements.txt
  echo.
  pause
  exit /b
)

echo.
echo  Iniciando servidor...
echo.

:: Abre o navegador
start http://localhost:5000

echo  Sistema iniciado com sucesso!
echo  Acesse: http://localhost:5000
echo.
echo  Para encerrar o sistema, feche esta janela.
echo.

:: Inicia o Flask nesta mesma janela
venv\Scripts\python.exe app.py