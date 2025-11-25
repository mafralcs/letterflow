import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

export default function ProjectForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language: "pt-BR",
    frequency: "weekly",
    author_name: "",
    author_bio: "",
    tone: "",
    structure: "",
  });

  useEffect(() => {
    if (isEditing) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        description: data.description || "",
        language: data.language,
        frequency: data.frequency,
        author_name: data.author_name,
        author_bio: data.author_bio || "",
        tone: data.tone || "",
        structure: data.structure || "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar projeto",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isEditing) {
        const { error } = await supabase
          .from("projects")
          .update(formData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Projeto atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("projects")
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Projeto criado!",
          description: "Seu novo projeto foi criado com sucesso.",
        });
      }

      navigate("/dashboard");
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

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Projeto deletado!",
        description: "O projeto foi removido com sucesso.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao deletar projeto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

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
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-lg-custom">
          <CardHeader>
            <CardTitle className="text-2xl font-display">
              {isEditing ? "Editar Projeto" : "Novo Projeto"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Atualize as configurações do seu projeto"
                : "Crie um novo projeto para organizar suas newsletters"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Tuti – Mercado de Madeira"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva brevemente sobre o que é este projeto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma Padrão *</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_name">Nome do Autor *</Label>
                <Input
                  id="author_name"
                  placeholder="Ex: Tuti"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_bio">Bio/Descrição do Autor</Label>
                <Textarea
                  id="author_bio"
                  placeholder="Ex: Analista do mercado global de madeira"
                  value={formData.author_bio}
                  onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom de Voz</Label>
                <Textarea
                  id="tone"
                  placeholder="Ex: Tom técnico, objetivo, B2B, claro, sem exageros, porém acessível."
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="structure">Estrutura Padrão da Newsletter</Label>
                <Textarea
                  id="structure"
                  placeholder="Ex: 1) Abertura com panorama geral (2–3 parágrafos); 2) Bloco por notícia com título, resumo, comentário em primeira pessoa; 3) Fechamento com visão geral e CTA leve."
                  value={formData.structure}
                  onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>{isEditing ? "Salvar Alterações" : "Criar Projeto"}</>
                  )}
                </Button>
              </div>
            </form>

            {isEditing && (
              <div className="mt-8 pt-6 border-t border-destructive/20">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-destructive">Zona de Perigo</h3>
                  <p className="text-sm text-muted-foreground">
                    A exclusão do projeto removerá permanentemente todas as newsletters associadas.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="mt-2"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deletando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deletar Projeto
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não poderá ser desfeita. Isso irá deletar permanentemente o
                          projeto <strong>"{formData.name}"</strong> e todas as newsletters
                          associadas a ele.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, deletar projeto
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
