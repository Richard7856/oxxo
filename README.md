# OXXO Logistics System

Sistema de logística y gestión de incidencias para entregas en tiendas OXXO.

## 🎯 Descripción

Aplicación web para gestión de reportes de entrega con tres roles de usuario:

- **Conductores**: Crean reportes de entregas con evidencia fotográfica
- **Comerciales**: Monitorean y resuelven incidencias por zona
- **Administradores**: Gestión completa de usuarios, zonas y exportaciones

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage)
- **IA**: OpenAI GPT-4 (extracción de datos, análisis de chat)
- **Integración**: n8n (validación de tiendas, notificaciones)

### Estado del Sistema

El sistema utiliza una **máquina de estados unificada** para gestionar el ciclo de vida de los reportes:

```
draft → submitted → resolved_by_driver/timed_out → completed → archived
```

## 📋 Requisitos Previos

- Node.js 18+
- npm o pnpm
- Cuenta de Supabase
- Cuenta de OpenAI (API key)
- Instancia de n8n (opcional para producción)

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
cd oxxo-logistics
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Copiar las credenciales (URL y keys)
3. Ejecutar las migraciones en orden:

```bash
# En Supabase SQL Editor, ejecutar en orden:
001_create_enums.sql
002_create_stores.sql
003_create_user_profiles.sql
004_create_reportes.sql
005_create_messages.sql
006_create_processed_tickets.sql
007_create_triggers.sql
008_enable_rls.sql
009_rls_user_profiles.sql
010_rls_stores.sql
011_rls_reportes.sql
012_rls_messages.sql
013_rls_processed_tickets.sql
014_create_functions.sql
```

### 3. Configurar variables de entorno

Copiar `ENV_TEMPLATE.md` y crear `.env.local`:

```.env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id

# OpenAI
OPENAI_API_KEY=sk-your_api_key

# n8n (opcional)
N8N_VALIDATE_STORE_URL=https://your-n8n.com/webhook/validate-store
N8N_NOTIFY_AGENTS_URL=https://your-n8n.com/webhook/notify-agents
N8N_WEBHOOK_SECRET=your_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Storage en Supabase

1. Ir a Storage en Supabase Dashboard
2. Crear bucket `ticket-images` con las siguientes configuraciones:
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

3. Aplicar RLS policies en el bucket:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 5. Crear primer usuario administrador

```sql
-- En Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@oxxo.com', crypt('your_password', gen_salt('bf')));

-- Obtener el UUID del usuario creado y agregar perfil
INSERT INTO user_profiles (id, email, display_name, role)
VALUES (
  'UUID_DEL_USUARIO',
  'admin@oxxo.com',
  'Administrador',
  'administrador'
);
```

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
oxxo-logistics/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticación
│   ├── (conductor)/         # Panel de conductores
│   ├── (comercial)/         # Panel de comerciales
│   ├── (admin)/             # Panel de administradores
│   └── api/                 # API routes
├── lib/
│   ├── supabase/           # Clientes de Supabase
│   ├── ai/                 # Integraciones OpenAI
│   ├── state-machines/     # Máquina de estados
│   └── types/              # TypeScript types
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # Formularios
│   ├── chat/               # Sistema de chat
│   └── dashboard/          # Dashboards
└── supabase/
    └── migrations/         # Migraciones SQL
```

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas por rol:

- **Conductores**: Acceso solo a sus propios reportes
- **Comerciales**: Acceso solo a reportes de su zona
- **Administradores**: Acceso completo

### Autenticación

- Supabase Auth con email/password
- Sesiones gestionadas con cookies seguras
- Middleware para protección de rutas

## 🤖 Integraciones IA

### Extracción de Tickets (GPT-4 Vision)

```typescript
import { extractTicketData } from '@/lib/ai/extract-ticket-data';

const result = await extractTicketData(imageUrl);
// { numero, fecha, total, items, confidence }
```

### Análisis de Resolución (GPT-4)

```typescript
import { analyzeChatResolution } from '@/lib/ai/analyze-resolution';

const analysis = await analyzeChatResolution(message, context);
// { isResolved, confidence, reasoning }
```

## 🔄 Máquina de Estados

```typescript
import { createStateMachine } from '@/lib/state-machines/reporte-state';

const machine = createStateMachine(reporte, chatMessageCount);

// Verificar transición válida
if (machine.canTransition('SUBMIT')) {
  const newState = machine.transition('SUBMIT');
}

// Obtener transiciones válidas
const validEvents = machine.getValidTransitions();
```

## 🌐 n8n Webhooks

### Validar Tienda

**Endpoint**: `POST /api/webhooks/validate-store`

```json
{
  "codigo_tienda": "12345"
}
```

**Respuesta**:
```json
{
  "valid": true,
  "store": {
    "codigo": "12345",
    "nombre": "OXXO Centro",
    "zona": "Norte",
    "direccion": "..."
  }
}
```

### Notificar Agentes

Disparado automáticamente cuando `reporte.status` cambia a `submitted`.

## ⏲️ Timeout Management

El sistema implementa un timeout de 20 minutos para reportes en estado `submitted`.

**Opciones de implementación**:

1. **Vercel Cron** (Recomendado):

```typescript
// app/api/cron/check-timeouts/route.ts
export async function GET() {
  // Actualizar reportes vencidos
}
```

2. **n8n Workflow** (5 minutos):

```sql
UPDATE reportes
SET status = 'timed_out'
WHERE status = 'submitted'
  AND timeout_at < NOW();
```

## 📊 Tipos de Reporte

1. **Rechazo Completo**: Tienda rechaza toda la entrega
2. **Rechazo Parcial**: Tienda rechaza algunos productos
3. **Devolución**: Conductor devuelve productos
4. **Faltante**: Faltan productos en la entrega
5. **Sobrante**: Sobran productos en la entrega

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Vercel (Recomendado)

```bash
npm run build
vercel --prod
```

Configurar variables de entorno en Vercel Dashboard.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 📝 Roadmap

- [ ] Implementar componentes UI con shadcn/ui
- [ ] Desarrollar flujo completo de conductor
- [ ] Crear dashboard de comerciales
- [ ] Construir panel de administración
- [ ] Implementar sistema de chat en tiempo real
- [ ] Agregar exportaciones CSV/Excel
- [ ] Tests unitarios y de integración
- [ ] Documentación de API

## 🤝 Contribuir

Este proyecto sigue las convenciones de [Conventional Commits](https://www.conventionalcommits.org/).

## 📄 Licencia

Propietario - OXXO Logistics

---

**Arquitectura diseñada por**: Google Deepmind Antigravity
**Versión**: 0.1.0
