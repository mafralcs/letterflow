import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles, Zap, Check } from "lucide-react";
import BackgroundPaths from "@/components/BackgroundPaths";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
    <div className="min-h-screen bg-gradient-subtle relative">
      <BackgroundPaths />
      <Header />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-sm font-medium text-primary">Powered by AI</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
              Newsletters profissionais em minutos
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Organize projetos. Cole links. Gere newsletters com IA.
              <br />
              <span className="text-primary font-medium">Simples assim.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="gap-2 text-lg px-8 shadow-lg hover:shadow-xl transition-all"
            >
              Começar Agora
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth?mode=login")}
              className="gap-2 text-lg px-8 border-2"
            >
              Já tenho conta
            </Button>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-3 gap-6 mt-20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-card border border-border/50 hover:shadow-lg transition-all hover:scale-105">
              <div className="h-14 w-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <FileText className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Organize por Projetos
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Crie projetos para cada cliente ou tema. Mantenha tudo organizado e profissional.
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-card border border-border/50 hover:shadow-lg transition-all hover:scale-105">
              <div className="h-14 w-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Cole os Links
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Adicione os links das notícias ou artigos que deseja incluir em sua newsletter.
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-card border border-border/50 hover:shadow-lg transition-all hover:scale-105">
              <div className="h-14 w-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                IA Faz o Resto
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Nossa IA lê os links e cria uma newsletter profissional no seu tom de voz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="benefits" className="bg-card/30 backdrop-blur-sm border-y py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Por que usar o LetterFlow?
              </h2>
              <p className="text-muted-foreground text-lg">
                Economize horas toda semana criando newsletters
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { text: "Configure uma vez, use sempre", icon: Check },
                { text: "Mantenha seu tom de voz único", icon: Check },
                { text: "Suporte para múltiplos projetos", icon: Check },
                { text: "Gere em segundos, não horas", icon: Check },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-card/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 relative">
        <div className="max-w-3xl mx-auto text-center space-y-8 bg-gradient-primary p-12 rounded-3xl shadow-lg-custom">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            Pronto para criar sua primeira newsletter?
          </h2>
          <p className="text-white/90 text-lg">
            Comece gratuitamente hoje mesmo. Sem cartão de crédito necessário.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
            className="gap-2 text-lg px-8 bg-white text-primary hover:bg-white/90 shadow-xl"
          >
            Começar Agora
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
