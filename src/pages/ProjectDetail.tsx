import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Settings, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;

    try {
      const [projectResult, newslettersResult] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("newsletters")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (projectResult.error) throw projectResult.error;
      if (newslettersResult.error) throw newslettersResult.error;

      setProject(projectResult.data);
      setNewsletters(newslettersResult.data || []);
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
      </main>
    </div>
  );
}
