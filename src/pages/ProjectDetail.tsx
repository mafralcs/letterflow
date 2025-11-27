import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Settings, FileText, Calendar, Database, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SpreadsheetCard } from "@/components/SpreadsheetCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  name: string;
  description: string | null;
  language: string;
  frequency: string;
  author_name: string;
}

interface Newsletter {
  id: string;
  title: string;
  status: string;
  created_at: string;
  links_raw: string | null;
}

interface Spreadsheet {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSpreadsheetId, setDeleteSpreadsheetId] = useState<string | null>(null);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;

    try {
      const [projectResult, newslettersResult, spreadsheetsResult] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("newsletters")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("project_spreadsheets")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (projectResult.error) throw projectResult.error;
      if (newslettersResult.error) throw newslettersResult.error;
      if (spreadsheetsResult.error) throw spreadsheetsResult.error;

      setProject(projectResult.data);
      setNewsletters(newslettersResult.data || []);
      setSpreadsheets(spreadsheetsResult.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpreadsheet = async () => {
    if (!deleteSpreadsheetId) return;

    try {
      const { error } = await supabase
        .from("project_spreadsheets")
        .delete()
        .eq("id", deleteSpreadsheetId);

      if (error) throw error;

      toast({
        title: "Planilha excluída",
        description: "A planilha foi excluída com sucesso.",
      });

      setSpreadsheets(spreadsheets.filter(s => s.id !== deleteSpreadsheetId));
      setDeleteSpreadsheetId(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir planilha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    draft: { label: "Rascunho", variant: "outline" },
    generating: { label: "Gerando", variant: "secondary" },
    final: { label: "Final", variant: "default" },
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
  };

  const languageLabels: Record<string, string> = {
    "pt-BR": "Português",
    "en": "Inglês",
    "es": "Espanhol",
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display">{project.name}</h1>
              <p className="text-muted-foreground mt-1">
                {project.description || "Sem descrição"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/projects/${id}/edit`)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
              <Button onClick={() => navigate(`/projects/${id}/newsletters/new`)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Newsletter
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {frequencyLabels[project.frequency]}
            </Badge>
            <Badge variant="secondary">
              🌐 {languageLabels[project.language]}
            </Badge>
            <Badge variant="secondary">
              ✍️ {project.author_name}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="newsletters" className="mt-8">
          <TabsList>
            <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="newsletters" className="mt-6">
            {newsletters.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma newsletter ainda</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Nenhuma newsletter criada ainda para este projeto. Clique em "Nova Newsletter" para gerar a primeira.
                  </p>
                  <Button onClick={() => navigate(`/projects/${id}/newsletters/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira newsletter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {newsletters.map((newsletter) => {
                  const linkCount = newsletter.links_raw
                    ? newsletter.links_raw.split("\n").filter((l) => l.trim()).length
                    : 0;
                  const statusInfo = statusLabels[newsletter.status] || statusLabels.draft;

                  return (
                    <Card
                      key={newsletter.id}
                      className="hover:shadow-lg-custom transition-shadow cursor-pointer"
                      onClick={() => navigate(`/projects/${id}/newsletters/${newsletter.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="truncate">{newsletter.title}</CardTitle>
                            <CardDescription>
                              Criada em {new Date(newsletter.created_at).toLocaleDateString("pt-BR")}
                            </CardDescription>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      </CardHeader>
                      {linkCount > 0 && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {linkCount} {linkCount === 1 ? "link" : "links"}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="database" className="mt-6">
            <div className="mb-6">
              <Button onClick={() => navigate(`/projects/${id}/spreadsheets/new`)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Planilha
              </Button>
            </div>

            {spreadsheets.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma planilha ainda</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Crie planilhas com dados estruturados que serão incluídos automaticamente na geração das newsletters.
                  </p>
                  <Button onClick={() => navigate(`/projects/${id}/spreadsheets/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira planilha
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {spreadsheets.map((spreadsheet) => (
                  <SpreadsheetCard
                    key={spreadsheet.id}
                    id={spreadsheet.id}
                    projectId={id!}
                    name={spreadsheet.name}
                    description={spreadsheet.description || undefined}
                    columnCount={0}
                    rowCount={0}
                    onDelete={() => setDeleteSpreadsheetId(spreadsheet.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteSpreadsheetId} onOpenChange={(open) => !open && setDeleteSpreadsheetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta planilha? Essa ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSpreadsheet} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
