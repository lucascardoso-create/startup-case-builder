CREATE POLICY "candidato le seus arquivos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'complementares' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candidato envia seus arquivos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complementares' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candidato atualiza seus arquivos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'complementares' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candidato remove seus arquivos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'complementares' AND (storage.foldername(name))[1] = auth.uid()::text);