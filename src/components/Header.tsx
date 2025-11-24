import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-white">L</span>
            </div>
            <span className="font-display text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LetterFlow
            </span>
          </div>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Benefícios
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Preços
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth?mode=login")}
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="gap-2"
            >
              Começar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
