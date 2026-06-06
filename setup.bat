@echo off
title iComanda Setup Tool
echo ==========================================
echo        iComanda - Windows Setup
echo ==========================================
echo.

:: 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor, descarga e instala Node.js desde https://nodejs.org/ antes de continuar.
    pause
    exit /b 1
)

echo [OK] Node.js detectado:
node -v
echo.

:: 2. Instalar dependencias
echo [1/3] Instalando dependencias de Node (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema al instalar las dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas con exito.
echo.

:: 3. Configurar variables de entorno
echo [2/3] Configurando archivo de variables de entorno (.env)...
if not exist .env (
    copy .env.example .env >nul
    echo [OK] Archivo .env creado. 
    echo IMPORTANTE: Por favor, abre el archivo .env y completa las credenciales de Supabase.
) else (
    echo [INFO] El archivo .env ya existe. Omitiendo creacion.
)
echo.

:: 4. Preguntar si desea iniciar
echo [3/3] Configuracion completada.
echo.
set /p run_app="¿Deseas iniciar la aplicacion en modo Web ahora? (S/N): "
if /i "%run_app%"=="S" (
    echo Iniciando aplicacion...
    npm run web
) else (
    echo.
    echo Para iniciar la aplicacion mas tarde, ejecuta: npm run web
    echo.
    pause
)
