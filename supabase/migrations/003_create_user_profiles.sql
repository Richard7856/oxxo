-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'conductor',
  zona TEXT, -- Required for comercial role
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT comercial_must_have_zona CHECK (
    role != 'comercial' OR zona IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_zona ON user_profiles(zona);

-- Comments
COMMENT ON TABLE user_profiles IS 'Extended user profiles linked to Supabase Auth';
COMMENT ON CONSTRAINT comercial_must_have_zona ON user_profiles IS 'Comerciales must have an assigned zona';
