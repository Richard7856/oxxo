# Verdefrut — Sistema de Gestión de Entregas

Sistema de gestión de entregas e incidencias para conductores y agentes comerciales de Verdefrut.

## El Problema

Cuando un conductor llega a una tienda y hay un problema con la entrega (rechazo, devolución, faltante), el proceso era manual y desconectado: papeles, llamadas, fotos por WhatsApp sin estructura. Los agentes comerciales no tenían visibilidad en tiempo real y no podían dar soporte rápido.

## La Solución

Una PWA (Progressive Web App) que guía al conductor paso a paso durante la entrega, captura evidencia fotográfica, extrae datos de tickets con IA, y conecta al conductor con el agente comercial de su zona via chat en tiempo real — todo desde el celular, sin instalar nada.

---

## Funcionalidades

### Para el Conductor
- **Flujo guiado de entrega**: asistente paso a paso (tienda → tipo de reporte → evidencia → ticket → envío)
- **5 tipos de reporte**: Rechazo Completo, Rechazo Parcial, Devolución, Faltante, Sobrante
- **Captura de evidencia**: fotos comprimidas automáticamente (<2MB, calidad 85%)
- **Extracción de tickets con IA**: Claude Vision lee el ticket y extrae número, fecha, total e ítems automáticamente
- **Chat en tiempo real**: comunicación directa con el agente comercial durante el reporte
- **Timer de 20 minutos**: cuenta regresiva visible para resolver la incidencia antes del timeout
- **Borrador persistente**: si cierra la app, puede continuar donde quedó

### Para el Agente Comercial
- **Dashboard por zona**: ve todos los reportes enviados en su zona en tiempo real
- **Chat con el conductor**: responde directamente desde el panel, puede enviar imágenes
- **Resolución de incidencias**: marca reportes como resueltos con comentario
- **Notificaciones push**: recibe alerta cuando un conductor envía un reporte nuevo

### Para el Administrador
- **Gestión de usuarios**: asigna roles (conductor/comercial/administrador) y zonas
- **Catálogo de tiendas**: alta y gestión de tiendas por zona
- **Exportación de datos**: descarga reportes en CSV/Excel para análisis

### Técnicas
- **PWA instalable**: funciona como app nativa en iOS y Android, sin App Store
- **Notificaciones push**: via Web Push (VAPID), incluso con la app cerrada
- **Autenticación segura**: Supabase Auth + cookies httpOnly + middleware de sesión
- **RLS en base de datos**: conductores solo ven sus reportes, comerciales solo su zona

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Server Actions |
| Base de Datos | Supabase (PostgreSQL + Realtime + RLS) |
| Autenticación | Supabase Auth |
| Storage | Supabase Storage (buckets: `evidence`, `ticket-images`) |
| IA — Extracción de tickets | Claude Vision (claude-sonnet-4-6) |
| IA — Análisis de resolución | Claude (analyze-resolution) |
| Notificaciones Push | Web Push API + VAPID |
| PWA | next-pwa + Service Worker personalizado |
| Integraciones | n8n (validación de tiendas) |
| Deployment | Docker + Traefik en VPS |

---

## Arquitectura de Roles

```
/login                    → Todos los usuarios
/                         → Selector de rol (según perfil en DB)
/conductor/               → Conductores y Administradores
/comercial/               → Agentes Comerciales y Administradores
/admin/                   → Solo Administradores
```

### Ciclo de Vida del Reporte

```
draft → submitted → resolved_by_driver
                 → timed_out          → completed → archived
```

Los reportes en `submitted` tienen 20 minutos para ser resueltos. Pasado ese tiempo cambian a `timed_out` automáticamente.

---

## Instalación

### Requisitos

- Node.js 18+
- Cuenta de Supabase
- API Key de Anthropic (Claude)
- Instancia de n8n (para validación de tiendas)

### Variables de entorno

Crear `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id

# Anthropic (Claude Vision + análisis de chat)
ANTHROPIC_API_KEY=sk-ant-your_key

# n8n
N8N_VALIDATE_STORE_URL=https://your-n8n.com/webhook/validate-store
N8N_TEMPLATE_URL=https://your-n8n.com/webhook/template

# Push Notifications (generar con: node scripts/generate-vapid-keys.js)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@verdefrut.com

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Base de Datos

Ejecutar las migraciones en orden en el SQL Editor de Supabase:

```bash
supabase/migrations/001_create_enums.sql
supabase/migrations/002_create_stores.sql
...hasta...
supabase/migrations/025_*.sql
```

### Ejecutar en desarrollo

```bash
npm install
npm run dev
```

### Build de producción

```bash
npm run build   # Incluye inyección del service worker de push
```

---

## Comandos útiles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run lint             # ESLint
npm run db:types         # Regenerar tipos TypeScript desde Supabase
node scripts/generate-vapid-keys.js   # Generar claves VAPID para push
```

---

## Seguridad

- **RLS activo en todas las tablas**: cada rol solo accede a lo que le corresponde
- **Middleware de sesión**: protege todas las rutas, redirige a `/login` si no hay sesión
- **Service Role Key**: solo usada en server-side (API routes, Server Actions)
- **Imágenes de tickets**: bucket privado con políticas de acceso por `user_id`

---

## Licencia

Propietario — Verdefrut
