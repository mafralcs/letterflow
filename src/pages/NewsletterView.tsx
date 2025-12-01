import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Code, Edit, Copy, RefreshCw, Trash2, StopCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Newsletter {
  id: string;
  title: string;
  status: string;
  links_raw: string | null;
  notes: string | null;
  html_content: string | null;
  text_content: string | null;
  created_at: string;
}

export default function NewsletterView() {
  const { projectId, newsletterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadNewsletter();
    
    // Set up polling if newsletter is generating
    let pollInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        if (!newsletterId) return;
        
        const { data } = await supabase
          .from('newsletters')
          .select('status, html_content, text_content, error_message')
          .eq('id', newsletterId)
          .single();
        
        if (data && data.status !== 'generating') {
          setNewsletter(prev => prev ? { ...prev, ...data } : null);
          clearInterval(pollInterval);
          
          if (data.status === 'final') {
            toast({
              title: "Newsletter gerada!",
              description: "Sua newsletter está pronta.",
            });
          } else if (data.status === 'error') {
            toast({
              title: "Erro na geração",
              description: data.error_message || "Ocorreu um erro ao gerar a newsletter.",
              variant: "destructive",
            });
          }
        }
      }, 3000); // Poll every 3 seconds
    };
    
    if (newsletter?.status === 'generating') {
      startPolling();
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [newsletterId, newsletter?.status]);

  const loadNewsletter = async () => {
    if (!newsletterId) return;

    try {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq("id", newsletterId)
        .single();

      if (error) throw error;

      setNewsletter(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar newsletter",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const copyHtmlToClipboard = async () => {
    if (!newsletter?.html_content) return;
    
    try {
      await navigator.clipboard.writeText(newsletter.html_content);
      toast({
        title: "HTML copiado!",
        description: "O código HTML foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o HTML.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!newsletterId) return;
    
    setRegenerating(true);

    try {
      // Update status to generating
      const { error: updateError } = await supabase
        .from("newsletters")
        .update({ 
          status: "generating",
          error_message: null
        })
        .eq("id", newsletterId);

      if (updateError) throw updateError;

      // Update local state
      setNewsletter(prev => prev ? { ...prev, status: "generating" } : null);

      // Call edge function
      const { error: functionError } = await supabase.functions.invoke(
        "generate-newsletter",
        {
          body: { newsletterId },
        }
      );

      if (functionError) throw functionError;

      toast({
        title: "Regenerando newsletter",
        description: "Sua newsletter está sendo gerada novamente.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao regenerar",
        description: error.message,
        variant: "destructive",
      });
      // Reload newsletter to get the actual state
      loadNewsletter();
    } finally {
      setRegenerating(false);
    }
  };

  const handleCancelGeneration = async () => {
    if (!newsletterId) return;
    
    setCancelling(true);
    
    try {
      const { error } = await supabase
        .from("newsletters")
        .update({ 
          status: "draft",
          error_message: "Geração cancelada pelo usuário"
        })
        .eq("id", newsletterId);

      if (error) throw error;

      setNewsletter(prev => prev ? { ...prev, status: "draft" } : null);

      toast({
        title: "Geração cancelada",
        description: "A geração da newsletter foi interrompida.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!newsletterId) return;
    
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("newsletters")
        .delete()
        .eq("id", newsletterId);

      if (error) throw error;

      toast({
        title: "Newsletter excluída!",
        description: "A newsletter foi removida com sucesso.",
      });

      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    draft: { label: "Rascunho", variant: "outline" },
    generating: { label: "Gerando", variant: "secondary" },
    final: { label: "Final", variant: "default" },
    error: { label: "Erro", variant: "destructive" },
  };

  if (loading || !newsletter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const statusInfo = statusLabels[newsletter.status] || statusLabels.draft;

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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display">{newsletter.title}</h1>
              <p className="text-muted-foreground mt-1">
                Criada em {new Date(newsletter.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2 items-start flex-wrap">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {newsletter.status !== "generating" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/projects/${projectId}/newsletters/${newsletterId}/edit`)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                    Regenerar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={deleting}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não poderá ser desfeita. A newsletter será excluída permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>

        {newsletter.status === "generating" ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Gerando sua newsletter...</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Estamos processando seus links e criando a newsletter. Isso pode levar alguns minutos.
              </p>
              <Button
                variant="outline"
                onClick={handleCancelGeneration}
                disabled={cancelling}
                className="gap-2"
              >
                <StopCircle className="h-4 w-4" />
                {cancelling ? "Cancelando..." : "Parar Geração"}
              </Button>
            </CardContent>
          </Card>
        ) : newsletter.status === "error" ? (
          <Card className="shadow-card border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-destructive text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Erro na geração</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {(newsletter as any).error_message || 'Ocorreu um erro ao gerar a newsletter.'}
              </p>
              <Button
                onClick={() => navigate(`/projects/${projectId}/newsletters/${newsletterId}/edit`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="preview" className="gap-2">
                <FileText className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="html" className="gap-2">
                <Code className="h-4 w-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                Texto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-6">
              <Card className="shadow-lg-custom">
                <CardHeader>
                  <CardTitle>Preview da Newsletter</CardTitle>
                </CardHeader>
                <CardContent className="max-h-none overflow-visible">
                  {newsletter.html_content ? (
                    <iframe
                      srcDoc={newsletter.html_content}
                      title="Newsletter Preview"
                      className="w-full min-h-[600px] border-0 rounded-lg bg-background"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Conteúdo HTML não disponível ainda.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="html" className="mt-6">
              <Card className="shadow-lg-custom">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Código HTML</CardTitle>
                  {newsletter.html_content && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyHtmlToClipboard}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar HTML
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {newsletter.html_content ? (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{newsletter.html_content}</code>
                    </pre>
                  ) : (
                    <div className="text-center py-12">
                      <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Conteúdo HTML não disponível ainda.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="mt-6">
              <Card className="shadow-lg-custom">
                <CardHeader>
                  <CardTitle>Versão Texto</CardTitle>
                </CardHeader>
                <CardContent>
                  {newsletter.text_content ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {newsletter.text_content}
                    </pre>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Conteúdo em texto não disponível ainda.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {(newsletter.links_raw || newsletter.notes) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {newsletter.links_raw && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links Utilizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {newsletter.links_raw.split("\n").filter((l) => l.trim()).map((link, idx) => (
                      <li key={idx} className="text-sm truncate">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {newsletter.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas / Brief</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{newsletter.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
