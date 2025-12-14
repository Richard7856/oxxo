-- Chat messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id uuid NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  
  sender message_sender NOT NULL,
  sender_user_id uuid REFERENCES user_profiles(id), -- NULL for agent/system
  
  text TEXT,
  image_url TEXT,
  
  -- AI analysis (when sender = 'user')
  ai_resolution_detected BOOLEAN, -- Did GPT think this resolves the issue?
  ai_confidence FLOAT, -- 0.0 to 1.0
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT message_must_have_content CHECK (
    text IS NOT NULL OR image_url IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_messages_reporte_id ON messages(reporte_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender);

-- Comments
COMMENT ON TABLE messages IS 'Chat messages for reporte resolution';
COMMENT ON COLUMN messages.ai_resolution_detected IS 'GPT-4 analysis: does message indicate resolution?';
