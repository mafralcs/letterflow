-- Add error_message column to newsletters table
ALTER TABLE public.newsletters 
ADD COLUMN IF NOT EXISTS error_message text;