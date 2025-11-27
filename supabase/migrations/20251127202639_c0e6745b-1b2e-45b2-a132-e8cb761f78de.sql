-- Create project_spreadsheets table
CREATE TABLE public.project_spreadsheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spreadsheet_columns table
CREATE TABLE public.spreadsheet_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.project_spreadsheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  column_type TEXT NOT NULL CHECK (column_type IN ('text', 'number', 'date', 'boolean')),
  column_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spreadsheet_rows table
CREATE TABLE public.spreadsheet_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.project_spreadsheets(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  row_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_spreadsheets
CREATE POLICY "Users can view their own spreadsheets"
  ON public.project_spreadsheets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spreadsheets"
  ON public.project_spreadsheets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spreadsheets"
  ON public.project_spreadsheets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spreadsheets"
  ON public.project_spreadsheets
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for spreadsheet_columns
CREATE POLICY "Users can view columns of their spreadsheets"
  ON public.spreadsheet_columns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_columns.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create columns in their spreadsheets"
  ON public.spreadsheet_columns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_columns.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update columns in their spreadsheets"
  ON public.spreadsheet_columns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_columns.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete columns in their spreadsheets"
  ON public.spreadsheet_columns
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_columns.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for spreadsheet_rows
CREATE POLICY "Users can view rows of their spreadsheets"
  ON public.spreadsheet_rows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_rows.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rows in their spreadsheets"
  ON public.spreadsheet_rows
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_rows.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rows in their spreadsheets"
  ON public.spreadsheet_rows
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_rows.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rows in their spreadsheets"
  ON public.spreadsheet_rows
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_spreadsheets
      WHERE id = spreadsheet_rows.spreadsheet_id
      AND user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_project_spreadsheets_updated_at
  BEFORE UPDATE ON public.project_spreadsheets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_spreadsheet_rows_updated_at
  BEFORE UPDATE ON public.spreadsheet_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_project_spreadsheets_project_id ON public.project_spreadsheets(project_id);
CREATE INDEX idx_project_spreadsheets_user_id ON public.project_spreadsheets(user_id);
CREATE INDEX idx_spreadsheet_columns_spreadsheet_id ON public.spreadsheet_columns(spreadsheet_id);
CREATE INDEX idx_spreadsheet_columns_order ON public.spreadsheet_columns(spreadsheet_id, column_order);
CREATE INDEX idx_spreadsheet_rows_spreadsheet_id ON public.spreadsheet_rows(spreadsheet_id);
CREATE INDEX idx_spreadsheet_rows_order ON public.spreadsheet_rows(spreadsheet_id, row_order);