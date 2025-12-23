-- Improved function to automatically create user profile on signup
-- This version handles edge cases and prevents duplicate inserts

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create profile if it doesn't already exist (prevent duplicates)
  INSERT INTO public.user_profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'conductor', -- Default role for new users
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(COALESCE(NEW.email, 'unknown@example.com'), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates user profile when a new user signs up. Uses SECURITY DEFINER to bypass RLS.';

