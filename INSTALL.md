# iComanda - Guía de Instalación y Configuración

**Tecnologías:** Desarrollado en TypeScript utilizando Expo (React Native) para soporte móvil/web multiplataforma y Supabase (PostgreSQL) para la base de datos, autenticación y realtime.

---

## Enlaces del Proyecto

*   **Repositorio GitHub:** [https://github.com/DiegoBernalDev/iComanda.git](https://github.com/DiegoBernalDev/iComanda.git)
*   **Gestión del Proyecto (Notion):** [https://melon-egret-46a.notion.site/icomanda-umss](https://melon-egret-46a.notion.site/icomanda-umss) *(Contiene Historias de Usuario, tablero Kanban y reportes de sprint)*

---

## Pasos para la Instalación y Ejecución

### 1. Requisitos Previos
*   Tener instalado [Node.js](https://nodejs.org/) (versión LTS recomendada).
*   *Recomendable:* Un dispositivo móvil con la app [Expo Go](https://expo.dev/go) instalada (para pruebas en celular), aunque **el proyecto funciona y se puede probar completamente vía web** directamente en tu navegador.

### 2. Clonar el Repositorio
```bash
git clone https://github.com/DiegoBernalDev/iComanda.git
cd iComanda
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Configurar Variables de Entorno
Copia el archivo de ejemplo `.env.example` y renómbralo a `.env`:
```bash
cp .env.example .env
```
*Abre el archivo `.env` recién creado y completa las claves de tu proyecto de Supabase (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).*

### 5. Iniciar la Aplicación
Ejecuta el servidor de desarrollo de Expo:
```bash
npm start
```
*   Presiona **`w`** para abrir e interactuar en el navegador Web.
*   Presiona **`a`** para simulador de Android o **`i`** para simulador de iOS.
*   Escanea el código QR con la app **Expo Go** para probarlo directamente en tu teléfono móvil.

Para iniciar directamente en la plataforma web:
```bash
npm run web
```
