import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ColumnHeader } from "./ColumnHeader";
import { SpreadsheetCell } from "./SpreadsheetCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Column {
  id: string;
  name: string;
  column_type: string;
  column_order: number;
}

interface Row {
  id: string;
  data: any;
  row_order: number;
}

interface SpreadsheetEditorProps {
  spreadsheetId: string;
}

export const SpreadsheetEditor = ({ spreadsheetId }: SpreadsheetEditorProps) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSpreadsheetData();
  }, [spreadsheetId]);

  const loadSpreadsheetData = async () => {
    try {
      const [columnsRes, rowsRes] = await Promise.all([
        supabase
          .from('spreadsheet_columns')
          .select('*')
          .eq('spreadsheet_id', spreadsheetId)
          .order('column_order'),
        supabase
          .from('spreadsheet_rows')
          .select('*')
          .eq('spreadsheet_id', spreadsheetId)
          .order('row_order')
      ]);

      if (columnsRes.error) throw columnsRes.error;
      if (rowsRes.error) throw rowsRes.error;

      setColumns(columnsRes.data || []);
      setRows(rowsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar planilha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addColumn = async () => {
    try {
      const newOrder = columns.length;
      const { data, error } = await supabase
        .from('spreadsheet_columns')
        .insert({
          spreadsheet_id: spreadsheetId,
          name: `Coluna ${newOrder + 1}`,
          column_type: 'text',
          column_order: newOrder
        })
        .select()
        .single();

      if (error) throw error;
      setColumns([...columns, data]);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar coluna",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateColumn = async (columnId: string, updates: Partial<Column>) => {
    try {
      const { error } = await supabase
        .from('spreadsheet_columns')
        .update(updates)
        .eq('id', columnId);

      if (error) throw error;
      setColumns(columns.map(col => col.id === columnId ? { ...col, ...updates } : col));
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar coluna",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from('spreadsheet_columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;
      setColumns(columns.filter(col => col.id !== columnId));
    } catch (error: any) {
      toast({
        title: "Erro ao excluir coluna",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addRow = async () => {
    try {
      const newOrder = rows.length;
      const { data, error } = await supabase
        .from('spreadsheet_rows')
        .insert({
          spreadsheet_id: spreadsheetId,
          data: {},
          row_order: newOrder
        })
        .select()
        .single();

      if (error) throw error;
      setRows([...rows, data]);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar linha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateCell = async (rowId: string, columnName: string, value: any) => {
    try {
      const row = rows.find(r => r.id === rowId);
      if (!row) return;

      const newData = { ...row.data, [columnName]: value };
      const { error } = await supabase
        .from('spreadsheet_rows')
        .update({ data: newData })
        .eq('id', rowId);

      if (error) throw error;
      setRows(rows.map(r => r.id === rowId ? { ...r, data: newData } : r));
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar célula",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRow = async (rowId: string) => {
    try {
      const { error } = await supabase
        .from('spreadsheet_rows')
        .delete()
        .eq('id', rowId);

      if (error) throw error;
      setRows(rows.filter(r => r.id !== rowId));
    } catch (error: any) {
      toast({
        title: "Erro ao excluir linha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={addColumn} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Coluna
        </Button>
        <Button onClick={addRow} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Linha
        </Button>
      </div>

      <div className="border rounded-lg overflow-auto">
        <div className="min-w-full inline-block">
          <div className="flex">
            <div className="w-12 bg-muted border-r border-b"></div>
            {columns.map((column) => (
              <ColumnHeader
                key={column.id}
                name={column.name}
                type={column.column_type}
                onNameChange={(name) => updateColumn(column.id, { name })}
                onTypeChange={(column_type) => updateColumn(column.id, { column_type })}
                onDelete={() => deleteColumn(column.id)}
              />
            ))}
          </div>

          {rows.map((row, rowIndex) => (
            <div key={row.id} className="flex border-b last:border-b-0">
              <div className="w-12 bg-muted border-r flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRow(row.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              {columns.map((column) => (
                <div key={column.id} className="min-w-[200px] border-r last:border-r-0">
                  <SpreadsheetCell
                    value={row.data[column.name]}
                    columnType={column.column_type}
                    onChange={(value) => updateCell(row.id, column.name, value)}
                  />
                </div>
              ))}
            </div>
          ))}

          {rows.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma linha adicionada. Clique em "Adicionar Linha" para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
