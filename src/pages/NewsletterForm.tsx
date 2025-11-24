import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function NewsletterForm() {
  const { projectId, newsletterId } = useParams();
  const isEditing = Boolean(newsletterId);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    links_raw: "",
    notes: "",
  });

  useEffect(() => {
    loadProject();
    if (isEditing) {
      loadNewsletter();
    } else {
      // Auto-suggest title for new newsletters
      const today = new Date().toLocaleDateString("pt-BR");
      setFormData((prev) => ({ ...prev, title: `Newsletter – ${today}` }));
    }
  }, [projectId, newsletterId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      setProjectName(data.name);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar projeto",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const loadNewsletter = async () => {
    if (!newsletterId) return;

    try {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq("id", newsletterId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        links_raw: data.links_raw || "",
        notes: data.notes || "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar newsletter",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/projects/${projectId}`);
    }
  };

  const validateLinks = (links: string): boolean => {
    const lines = links.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return false;

    // Check if at least one line looks like a URL
    const urlPattern = /https?:\/\//;
    return lines.some((line) => urlPattern.test(line));
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para a newsletter.",
        variant: "destructive",
      });
      return;
    }

    if (!validateLinks(formData.links_raw)) {
      toast({
        title: "Links obrigatórios",
        description: "Por favor, adicione pelo menos um link válido (começando com http:// ou https://).",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create or update newsletter with "generating" status
      let newsletterData;
      if (isEditing) {
        const { data, error } = await supabase
          .from("newsletters")
          .update({
            ...formData,
            status: "generating",
          })
          .eq("id", newsletterId)
          .select()
          .single();

        if (error) throw error;
        newsletterData = data;
      } else {
        const { data, error } = await supabase
          .from("newsletters")
          .insert({
            ...formData,
            project_id: projectId,
            user_id: user.id,
            status: "generating",
          })
          .select()
          .single();

        if (error) throw error;
        newsletterData = data;
      }

      // Here we would call the n8n webhook
      // For now, we'll just show a success message and navigate
      toast({
        title: "Newsletter em geração!",
        description: "Aguarde enquanto processamos seus links...",
      });

      navigate(`/projects/${projectId}/newsletters/${newsletterData.id}`);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isEditing) {
        const { error } = await supabase
          .from("newsletters")
          .update({
            ...formData,
            status: "draft",
          })
          .eq("id", newsletterId);

        if (error) throw error;

        toast({
          title: "Rascunho salvo!",
          description: "Suas alterações foram salvas.",
        });
      } else {
        const { error } = await supabase
          .from("newsletters")
          .insert({
            ...formData,
            project_id: projectId,
            user_id: user.id,
            status: "draft",
          });

        if (error) throw error;

        toast({
          title: "Rascunho criado!",
          description: "Seu rascunho foi salvo com sucesso.",
        });
      }

      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Projeto
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-lg-custom">
          <CardHeader>
            <CardTitle className="text-2xl font-display">
              {isEditing ? "Editar Newsletter" : "Nova Newsletter"}
            </CardTitle>
            <CardDescription>
              Projeto: <strong>{projectName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Newsletter *</Label>
              <Input
                id="title"
                placeholder={`${projectName} – ${new Date().toLocaleDateString("pt-BR")}`}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="links">Links (um por linha) *</Label>
              <Textarea
                id="links"
                placeholder="Cole aqui os links, um por linha&#10;https://exemplo.com/noticia-1&#10;https://exemplo.com/noticia-2&#10;https://exemplo.com/noticia-3"
                value={formData.links_raw}
                onChange={(e) => setFormData({ ...formData, links_raw: e.target.value })}
                rows={8}
                required
              />
              <p className="text-sm text-muted-foreground">
                Cole os URLs das notícias/artigos que deseja incluir na newsletter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas / Brief desta Edição</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Essa edição deve focar mais em preços nos EUA."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Adicione observações específicas para esta edição (opcional)
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || generating}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Rascunho"
                )}
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading || generating}
                className="flex-1 gap-2 bg-gradient-primary"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Newsletter com IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
