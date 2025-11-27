import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface SpreadsheetImportProps {
  spreadsheetId: string;
  onImportComplete: () => void;
}

export const SpreadsheetImport = ({ spreadsheetId, onImportComplete }: SpreadsheetImportProps) => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const detectColumnType = (values: any[]): string => {
    const sampleSize = Math.min(10, values.length);
    const sample = values.slice(0, sampleSize).filter(v => v !== null && v !== undefined && v !== '');
    
    if (sample.length === 0) return 'text';
    
    // Check if all are booleans
    const boolValues = sample.every(v => 
      typeof v === 'boolean' || 
      v === 'true' || v === 'false' || 
      v === 'sim' || v === 'não' || 
      v === 'yes' || v === 'no'
    );
    if (boolValues) return 'boolean';
    
    // Check if all are numbers
    const numericValues = sample.every(v => !isNaN(Number(v)));
    if (numericValues) return 'number';
    
    // Check if all are dates
    const dateValues = sample.every(v => !isNaN(Date.parse(v)));
    if (dateValues) return 'date';
    
    return 'text';
  };

  const processData = async (data: any[][]) => {
    if (data.length === 0) {
      setError("Arquivo vazio ou inválido");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const headers = data[0];
      const rows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

      if (headers.length === 0 || rows.length === 0) {
        setError("Nenhum dado válido encontrado no arquivo");
        setImporting(false);
        return;
      }

      // Create columns
      const columnPromises = headers.map((header, index) => {
        const columnValues = rows.map(row => row[index]);
        const columnType = detectColumnType(columnValues);
        
        return supabase
          .from('spreadsheet_columns')
          .insert({
            spreadsheet_id: spreadsheetId,
            name: String(header || `Coluna ${index + 1}`),
            column_type: columnType,
            column_order: index
          })
          .select()
          .single();
      });

      const columnResults = await Promise.all(columnPromises);
      
      const hasError = columnResults.some(result => result.error);
      if (hasError) {
        throw new Error("Erro ao criar colunas");
      }

      // Create rows
      const rowPromises = rows.map((row, rowIndex) => {
        const rowData: any = {};
        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          rowData[String(header || `Coluna ${colIndex + 1}`)] = value !== undefined && value !== null ? value : '';
        });

        return supabase
          .from('spreadsheet_rows')
          .insert({
            spreadsheet_id: spreadsheetId,
            data: rowData,
            row_order: rowIndex
          });
      });

      await Promise.all(rowPromises);

      toast({
        title: "Importação concluída",
        description: `${headers.length} colunas e ${rows.length} linhas importadas com sucesso.`,
      });

      setOpen(false);
      onImportComplete();
    } catch (error: any) {
      console.error("Import error:", error);
      setError(error.message || "Erro ao importar arquivo");
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(file, {
          complete: (results) => {
            processData(results.data as any[][]);
          },
          error: (error) => {
            setError(`Erro ao ler CSV: ${error.message}`);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            processData(jsonData as any[][]);
          } catch (error: any) {
            setError(`Erro ao ler Excel: ${error.message}`);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError("Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)");
      }
    } catch (error: any) {
      setError(`Erro ao processar arquivo: ${error.message}`);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV/Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel para importar dados para esta planilha.
            A primeira linha deve conter os cabeçalhos das colunas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-sm text-muted-foreground mb-2">
                Clique para selecionar ou arraste um arquivo
              </div>
              <div className="text-xs text-muted-foreground">
                Formatos suportados: CSV, XLSX, XLS
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>

          {importing && (
            <div className="text-center text-sm text-muted-foreground">
              Importando dados...
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A importação criará novas colunas e linhas.
              Os tipos das colunas serão detectados automaticamente.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};
