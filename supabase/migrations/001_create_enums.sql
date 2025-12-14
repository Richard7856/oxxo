-- Create user roles enum
CREATE TYPE user_role AS ENUM ('conductor', 'comercial', 'administrador');

-- Create unified state machine enum
CREATE TYPE reporte_state AS ENUM (
  'draft',
  'submitted',
  'resolved_by_driver',
  'timed_out',
  'completed',
  'archived'
);

-- Create report types enum
CREATE TYPE reporte_type AS ENUM (
  'rechazo_completo',
  'rechazo_parcial',
  'devolucion',
  'faltante_sobrante'
);

-- Create message sender enum
CREATE TYPE message_sender AS ENUM ('user', 'agent', 'system');
