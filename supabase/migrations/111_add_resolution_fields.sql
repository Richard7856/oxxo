-- Migration 111: Add resolution_type and partial_failure_items to reportes
-- Tracks how an incident was resolved after the chat with the comercial agent

ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS resolution_type TEXT
    CHECK (resolution_type IN ('completa', 'parcial', 'sin_entrega', 'timed_out')),
  ADD COLUMN IF NOT EXISTS partial_failure_items JSONB;

COMMENT ON COLUMN reportes.resolution_type IS
  'How the delivery incident was resolved after chat: completa (full delivery), parcial (partial delivery), sin_entrega (no delivery), timed_out (20 min timer expired)';

COMMENT ON COLUMN reportes.partial_failure_items IS
  'Array of incident item IDs that failed to be delivered when resolution_type = parcial';
