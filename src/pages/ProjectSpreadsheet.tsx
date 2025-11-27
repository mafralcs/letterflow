import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpreadsheetEditor } from "@/components/SpreadsheetEditor";

export default function ProjectSpreadsheet() {
  const { projectId, spreadsheetId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const isEditing = !!spreadsheetId;

  useEffect(() => {
    if (isEditing) {
      loadSpreadsheet();
    }
  }, [spreadsheetId]);

  const loadSpreadsheet = async () => {
    try {
      const { data, error } = await supabase
        .from('project_spreadsheets')
        .select('*')
        .eq('id', spreadsheetId)
        .single();

      if (error) throw error;
      setName(data.name);
      setDescription(data.description || "");
    } catch (error: any) {
      toast({
        title: "Erro ao carregar planilha",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/projects/${projectId}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a planilha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isEditing) {
        const { error } = await supabase
          .from('project_spreadsheets')
          .update({ name, description })
          .eq('id', spreadsheetId);

        if (error) throw error;

        toast({
          title: "Planilha atualizada",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const { data, error } = await supabase
          .from('project_spreadsheets')
          .insert({
            project_id: projectId,
            user_id: user.id,
            name,
            description
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Planilha criada",
          description: "A planilha foi criada com sucesso.",
        });

        navigate(`/projects/${projectId}/spreadsheets/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar planilha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Editar Planilha" : "Nova Planilha"}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome da Planilha
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Fretes Competitivos"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Descrição (opcional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo desta planilha..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {isEditing && spreadsheetId && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dados da Planilha</h2>
              <SpreadsheetEditor spreadsheetId={spreadsheetId} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
