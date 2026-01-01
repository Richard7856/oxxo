# Configuración de PWA y Notificaciones Push

## Pasos para configurar

### 1. Generar VAPID Keys

Ejecuta el script para generar las claves VAPID:

```bash
node scripts/generate-vapid-keys.js
```

Esto generará una clave pública y una privada. Agrega estas variables a tu archivo `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
VAPID_SUBJECT=mailto:admin@oxxo.com
```

### 2. Crear iconos de la PWA

Necesitas crear dos iconos en la carpeta `public/`:
- `icon-192.png` (192x192 píxeles)
- `icon-512.png` (512x512 píxeles)

Puedes usar cualquier herramienta de diseño o generador de iconos PWA.

### 3. Configurar variables de entorno

Asegúrate de tener configurado:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@oxxo.com
NEXT_PUBLIC_APP_URL=https://tu-dominio.com  # Opcional, para producción
```

### 4. Construir la aplicación

```bash
npm run build
```

### 5. Probar la PWA

1. Abre la aplicación en el navegador
2. Ve a la página `/comercial`
3. Haz clic en "Instalar Aplicación" (si está disponible)
4. Activa las notificaciones push

## Funcionalidades

### Instalación PWA
- Los usuarios pueden instalar la aplicación desde el navegador
- Funciona en Chrome, Edge, Safari iOS, y Firefox
- La aplicación se puede usar sin conexión (con cache)

### Notificaciones Push
- Los comerciales reciben notificaciones cuando los conductores envían mensajes
- Las notificaciones solo se envían a comerciales de la misma zona
- Las suscripciones se guardan en la base de datos

## Troubleshooting

### Las notificaciones no funcionan
1. Verifica que las VAPID keys estén configuradas correctamente
2. Asegúrate de que el usuario haya dado permisos de notificación
3. Verifica que la aplicación esté instalada como PWA
4. Revisa la consola del navegador para errores

### La instalación PWA no aparece
1. Asegúrate de estar usando HTTPS (o localhost)
2. Verifica que el manifest.json esté accesible
3. Revisa que el service worker esté registrado correctamente

