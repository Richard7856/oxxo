-- Stores table (validated via n8n)
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tienda TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  zona TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stores_codigo ON stores(codigo_tienda);
CREATE INDEX idx_stores_zona ON stores(zona);

-- Comments for documentation
COMMENT ON TABLE stores IS 'OXXO store locations, validated via n8n integration';
COMMENT ON COLUMN stores.codigo_tienda IS 'Unique store code identifier';
COMMENT ON COLUMN stores.zona IS 'Geographic zone for comercial assignment';
