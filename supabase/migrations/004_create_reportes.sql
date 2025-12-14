-- Main reportes table with state management
CREATE TABLE reportes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  store_id uuid NOT NULL REFERENCES stores(id),
  
  -- State management
  status reporte_state NOT NULL DEFAULT 'draft',
  tipo_reporte reporte_type,
  
  -- Store snapshot (denormalized for historical accuracy)
  store_codigo TEXT NOT NULL,
  store_nombre TEXT NOT NULL,
  store_zona TEXT NOT NULL,
  
  -- Driver info
  conductor_nombre TEXT NOT NULL,
  
  -- Type-specific data
  motivo TEXT, -- For rechazo types
  rechazo_details JSONB, -- { productos: [], observaciones: "" }
  
  -- Extracted ticket data (from OpenAI)
  ticket_data JSONB, -- { numero: "", fecha: "", total: 0, items: [] }
  ticket_image_url TEXT,
  ticket_extraction_confirmed BOOLEAN DEFAULT false,
  
  -- Return ticket (for devoluciones)
  return_ticket_data JSONB,
  return_ticket_image_url TEXT,
  return_ticket_extraction_confirmed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ, -- When status -> submitted
  resolved_at TIMESTAMPTZ, -- When status -> completed
  timeout_at TIMESTAMPTZ, -- When 20min timer expires
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_reportes_user_id ON reportes(user_id);
CREATE INDEX idx_reportes_store_id ON reportes(store_id);
CREATE INDEX idx_reportes_status ON reportes(status);
CREATE INDEX idx_reportes_zona ON reportes(store_zona);
CREATE INDEX idx_reportes_created_at ON reportes(created_at DESC);

-- Composite index for comercial dashboard filtering
CREATE INDEX idx_reportes_zona_status ON reportes(store_zona, status);

-- Index for timeout job queries
CREATE INDEX idx_reportes_timeout ON reportes(status, timeout_at) 
  WHERE status = 'submitted';

-- Comments
COMMENT ON TABLE reportes IS 'Main delivery reports with state machine management';
COMMENT ON COLUMN reportes.ticket_data IS 'AI-extracted ticket data from OpenAI Vision';
COMMENT ON COLUMN reportes.timeout_at IS 'When chat timeout expires (20 minutes from submission)';
