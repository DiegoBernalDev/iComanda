#!/bin/bash

echo "=========================================="
echo "         iComanda - Linux Setup"
echo "=========================================="
echo

# 1. Verificar Node.js
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js no está instalado."
    echo "Por favor, instala Node.js antes de continuar (ej: sudo apt install nodejs npm)."
    exit 1
fi

echo "[OK] Node.js detectado: $(node -v)"
echo

# 2. Instalar dependencias
echo "[1/3] Instalando dependencias de Node (npm install)..."
npm install
if [ $? -ne 0 ]; then
    echo
    echo "[ERROR] Hubo un problema al instalar las dependencias."
    exit 1
fi
echo "[OK] Dependencias instaladas con éxito."
echo

# 3. Configurar variables de entorno
echo "[2/3] Configurando archivo de variables de entorno (.env)..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[OK] Archivo .env creado."
    echo "IMPORTANTE: Por favor, abre el archivo .env y completa las credenciales de Supabase."
else
    echo "[INFO] El archivo .env ya existe. Omitiendo creación."
fi
echo

# 4. Preguntar si desea iniciar
echo "[3/3] Configuración completada."
echo
read -p "¿Deseas iniciar la aplicación en modo Web ahora? (s/n): " run_app
if [[ "$run_app" =~ ^[Ss]$ ]]; then
    echo "Iniciando aplicación..."
    npm run web
else
    echo
    echo "Para iniciar la aplicación más tarde, ejecuta: npm run web"
    echo
fi
