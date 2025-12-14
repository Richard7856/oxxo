-- Archive for successfully processed tickets (admin export view)
CREATE TABLE processed_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  reporte_id uuid REFERENCES reportes(id),
  
  -- Ticket data snapshot
  ticket_number TEXT NOT NULL,
  store_cr TEXT NOT NULL, -- codigo tienda
  fecha DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL, -- Array of { descripcion, cantidad, precio }
  
  -- Evidence
  ticket_image_url TEXT NOT NULL,
  
  -- Audit
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by uuid NOT NULL REFERENCES user_profiles(id),
  
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_processed_tickets_fecha ON processed_tickets(fecha DESC);
CREATE INDEX idx_processed_tickets_store_cr ON processed_tickets(store_cr);
CREATE INDEX idx_processed_tickets_reporte_id ON processed_tickets(reporte_id);

-- Comments
COMMENT ON TABLE processed_tickets IS 'Archive of successfully processed tickets for admin export';
