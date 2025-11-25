import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, LogOut, Settings, FileText, Calendar, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/letterflow-logo.png";

interface Project {
  id: string;
  name: string;
  description: string | null;
  language: string;
  frequency: string;
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    loadUserProfile(session.user.id);
    loadProjects();
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        if (data.name) {
          setUserName(data.name);
        }
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error.message);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar projetos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="LetterFlow" className="h-15 w-auto" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/account-settings")}
              className="gap-2 h-10 px-3"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm">{userName || "Conta"}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            {userName && (
              <p className="text-lg text-muted-foreground mb-1">
                Olá, <span className="font-semibold text-foreground">{userName}</span>
              </p>
            )}
            <h2 className="text-3xl font-bold font-display">Meus Projetos</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie suas newsletters por projeto
            </p>
          </div>
          <Button onClick={() => navigate("/projects/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum projeto ainda</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Você ainda não tem projetos. Clique em "Novo Projeto" para começar.
              </p>
              <Button onClick={() => navigate("/projects/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Criar meu primeiro projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg-custom transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{project.name}</span>
                    <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {frequencyLabels[project.frequency] || project.frequency}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🌐</span>
                      {languageLabels[project.language] || project.language}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
