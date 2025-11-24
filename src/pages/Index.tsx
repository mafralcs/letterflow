import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles, Zap } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LetterFlow
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto">
              Organize projetos. Cole links. Gere newsletters com IA.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2 text-lg px-8"
            >
              Começar Agora
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="gap-2 text-lg px-8"
            >
              Fazer Login
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-card p-6 rounded-xl shadow-card">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Organize por Projetos
              </h3>
              <p className="text-muted-foreground">
                Crie projetos para cada cliente ou tema. Mantenha tudo organizado e profissional.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-card">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Cole os Links
              </h3>
              <p className="text-muted-foreground">
                Adicione os links das notícias ou artigos que deseja incluir em sua newsletter.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-card">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                IA Faz o Resto
              </h3>
              <p className="text-muted-foreground">
                Nossa IA lê os links e cria uma newsletter profissional no seu tom de voz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
