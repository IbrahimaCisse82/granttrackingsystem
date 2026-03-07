
-- Create storage bucket for transaction attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-attachments', 'transaction-attachments', true);

-- RLS: authenticated users can upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'transaction-attachments');

-- RLS: anyone authenticated can view attachments
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'transaction-attachments');

-- RLS: users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'transaction-attachments');
