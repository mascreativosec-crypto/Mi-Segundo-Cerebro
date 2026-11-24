# Guía de Despliegue en Hostinger (Node.js / Passenger) y VPS

## 1. Requisitos
- **Node.js 22+** (Hostinger Node.js Web App / Passenger o VPS).
- **Nota importante:** Este proyecto tiene backend Express (`/api/gemini/*`). **No** funcionará si solo subes `dist/` a un hosting estático PHP/HTML sin servidor Node.js.

## 2. Compilación y Punto de Entrada
```bash
npm install
npm run build
npm start
```
- `npm run build` compila el frontend en `dist/` **y** genera un único ejecutable Node sin dependencias de desarrollo en `server.js` (`esbuild`).
- **Archivo de entrada en Hostinger Passenger:** `server.js` (no requiere `tsx` en producción).
- **Script de inicio:** `NODE_ENV=production node server.js`.

## 3. Variables de Entorno (.env o Panel de Hostinger)
Configura al menos `GEMINI_API_KEY` en **Hostinger → Node.js → Environment Variables** (o en un archivo `.env` junto a `server.js`) y **reinicia la aplicación**:

| Variable | Obligatoria | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Sí (para IA) | — | Clave de Google AI Studio (`aistudio.google.com/apikey`). |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Modelo principal de texto (alta disponibilidad). |
| `GEMINI_FALLBACK_MODELS` | No | `gemini-4-hydrogen` | Cadena de respaldo separada por comas si hay 503/timeout. |
| `GEMINI_TRANSCRIBE_MODEL` | No | `gemini-3.5-transcribe` | Modelo de transcripción de audio. |
| `GEMINI_TIMEOUT_MS` | No | `25000` | Timeout máximo por intento a Gemini (ms). |
| `PORT` | No | `3000` | Puerto asignado por Hostinger/Passenger. |
| `ENABLE_DISK_STORAGE` | No | `false` | Activa carpeta persistente fuera de `hbuilds/versions/<id>/`. |
| `DATA_DIR` | No | Auto fuera de `hbuilds/` | Ruta absoluta externa para `datos/` y `respaldos/`. |

## 4. Verificación Post-Despliegue
Abre `https://tudominio.com/api/health` en tu navegador. Debe devolver JSON con:
```json
{
  "status": "ok",
  "aiConfigured": true,
  "model": "gemini-3.1-flash-lite",
  "fallbackModels": ["gemini-4-hydrogen"]
}
```
Si `aiConfigured` aparece `false`, el servidor Node.js no está leyendo `GEMINI_API_KEY` (revisa el panel de variables o `.env` y reinicia Node).

## 5. Aviso de Seguridad (Control de Acceso)
Esta versión almacena tus datos operativos localmente en el navegador (`localStorage` + `IndexedDB` para libros PDF) y no incluye pantalla de login multiusuario integrada. Si despliegas en una URL pública en Hostinger con datos financieros/personales reales, protege el dominio con autenticación en el servidor (ej. HTTP Basic Auth en Nginx/Apache/Cloudflare Access) o añade tu capa de autenticación antes de compartir la URL.
