-- Fix: Evidence bucket was publicly readable without authentication.
-- Any person with the URL could view ticket photos and sensitive evidence.
-- Restrict SELECT to authenticated users only.

DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Authenticated Access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence'
    AND auth.role() = 'authenticated'
  );
