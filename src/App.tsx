import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSpreadsheet from "./pages/ProjectSpreadsheet";
import NewsletterForm from "./pages/NewsletterForm";
import NewsletterView from "./pages/NewsletterView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id/edit" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/spreadsheets/new" element={<ProjectSpreadsheet />} />
          <Route path="/projects/:projectId/spreadsheets/:spreadsheetId" element={<ProjectSpreadsheet />} />
          <Route path="/projects/:projectId/newsletters/new" element={<NewsletterForm />} />
          <Route path="/projects/:projectId/newsletters/:newsletterId/edit" element={<NewsletterForm />} />
          <Route path="/projects/:projectId/newsletters/:newsletterId" element={<NewsletterView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
