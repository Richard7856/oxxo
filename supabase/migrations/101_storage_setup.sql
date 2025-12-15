-- Create evidence bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for evidence bucket

-- Allow public access to view (so support/admin can see)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence' AND
    auth.role() = 'authenticated'
  );

-- Allow users to update their own files (optional, but good)
CREATE POLICY "Owner Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'evidence' AND
    auth.uid() = owner
  );

-- Allow users to delete their own files
CREATE POLICY "Owner Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence' AND
    auth.uid() = owner
  );
