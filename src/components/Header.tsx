import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import logo from "@/assets/letterflow-logo.png";

export default function Header() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
            <img 
              src={logo} 
              alt="LetterFlow" 
              className="h-20 w-auto transition-all duration-300 group-hover:scale-105 group-hover:brightness-110" 
            />
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

          {/* Auth Buttons & Theme Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
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
