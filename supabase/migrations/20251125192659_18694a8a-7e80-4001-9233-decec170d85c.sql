-- Add design configuration fields to projects table
ALTER TABLE public.projects 
ADD COLUMN design_guidelines TEXT,
ADD COLUMN html_template TEXT;