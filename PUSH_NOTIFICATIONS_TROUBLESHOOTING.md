# Troubleshooting de Notificaciones Push

## Estado Actual de las Suscripciones

En la base de datos hay **3 suscripciones activas** de **2 usuarios únicos**:
- Usuario 1: 2 suscripciones (probablemente 2 dispositivos)
- Usuario 2: 1 suscripción

## Problemas Conocidos y Soluciones

### 1. Android: Notificaciones no funcionan cuando la app está cerrada

**Problema**: Las notificaciones llegan cuando la app está abierta, pero no cuando está cerrada.

**Causas posibles**:
- El service worker puede no estar activo cuando la app está cerrada
- Android puede estar matando el service worker para ahorrar batería
- Configuración de batería/optimización del dispositivo

**Soluciones**:

1. **Desactivar optimización de batería para el navegador**:
   - Ve a Configuración > Aplicaciones > [Tu navegador (Chrome/Firefox)]
   - Batería > Sin restricciones (o "No optimizar")
   - Esto permite que el service worker se mantenga activo en background

2. **Verificar que la PWA esté instalada correctamente**:
   - La PWA debe estar instalada (agregada a la pantalla de inicio)
   - Abre la PWA directamente desde el ícono de la pantalla de inicio, no desde el navegador

3. **Reinstalar la PWA**:
   - Desinstala la PWA
   - Vuelve a instalar desde el navegador
   - Activa las notificaciones nuevamente

4. **Verificar permisos de notificaciones**:
   - Configuración > Aplicaciones > [Tu PWA] > Notificaciones
   - Asegúrate de que estén habilitadas

### 2. iPhone/iOS: Notificaciones no funcionan

**Problema**: Las notificaciones push no llegan en dispositivos iOS.

**Limitaciones conocidas de iOS**:
- iOS solo soporta push notifications en PWAs desde **iOS 16.4+**
- Requiere que la PWA esté instalada correctamente (agregada a la pantalla de inicio)
- Las notificaciones push en PWAs de iOS son relativamente nuevas y tienen limitaciones
- Safari tiene soporte limitado comparado con Chrome/Firefox

**Requisitos para iOS**:
1. iOS 16.4 o superior
2. La PWA debe estar instalada (no solo abierta en Safari)
3. Permisos de notificaciones otorgados
4. Usar Safari (no otros navegadores en iOS)

**Soluciones**:

1. **Verificar versión de iOS**:
   - Configuración > General > Acerca de
   - Asegúrate de tener iOS 16.4 o superior

2. **Instalar la PWA correctamente**:
   - Abre la app en Safari (no en Chrome u otros navegadores)
   - Toca el botón de compartir (cuadrado con flecha)
   - Selecciona "Agregar a pantalla de inicio"
   - Abre la app desde el ícono de la pantalla de inicio

3. **Verificar permisos**:
   - Configuración > [Tu PWA] > Notificaciones
   - Asegúrate de que estén habilitadas

4. **Nota importante**: Si las notificaciones no funcionan en iOS después de seguir estos pasos, puede ser una limitación de la plataforma. iOS tiene soporte limitado para push notifications en PWAs comparado con Android.

### 3. Conteo de Suscripciones

**Estado**: Hay 3 suscripciones en la base de datos (2 usuarios únicos).

Si ves un conteo diferente en los logs, puede deberse a:
- Filtrado por usuarios con notificaciones habilitadas
- Suscripciones inválidas que fueron eliminadas
- Usuarios que no tienen notificaciones activadas en su metadata

**Verificar suscripciones activas**:
```sql
SELECT 
    ps.user_id,
    up.email,
    up.role,
    COUNT(*) as suscripciones
FROM push_subscriptions ps
JOIN user_profiles up ON ps.user_id = up.id
GROUP BY ps.user_id, up.email, up.role;
```

## Verificación del Service Worker

Para verificar que el service worker está funcionando correctamente:

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Application" (Chrome) o "Application" (Firefox)
3. En el menú lateral, selecciona "Service Workers"
4. Verifica que el service worker esté "activated and running"
5. Revisa los logs en la consola para mensajes que empiecen con `[SW]`

## Logs de Debugging

El código incluye logging detallado:
- `[Push]`: Logs del componente PushNotificationManager
- `[SW]`: Logs del service worker
- `[Push Notification]`: Logs del servidor al enviar notificaciones

Revisa estos logs para diagnosticar problemas.

## Próximos Pasos Recomendados

1. **Para Android**: Desactivar optimización de batería y reinstalar la PWA
2. **Para iOS**: Verificar iOS 16.4+ y reinstalar la PWA desde Safari
3. **Monitorear logs**: Revisar los logs del servidor para ver qué suscripciones están recibiendo notificaciones
