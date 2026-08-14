import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { CustomerFormPage } from '@/pages/CustomerFormPage';
import { CustomerDetailPage } from '@/pages/CustomerDetailPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { TeamPage } from '@/pages/TeamPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/chamados" element={<TicketsPage />} />
                    <Route path="/chamados/novo" element={<CreateTicketPage />} />
                    <Route path="/chamados/:id" element={<TicketDetailPage />} />
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/clientes" element={<CustomersPage />} />
                    <Route path="/clientes/novo" element={<CustomerFormPage />} />
                    <Route path="/clientes/:id" element={<CustomerDetailPage />} />
                    <Route path="/clientes/:id/editar" element={<CustomerFormPage />} />
                    <Route path="/base-de-conhecimento" element={<KnowledgeBasePage />} />
                    <Route path="/equipe" element={<TeamPage />} />
                    <Route path="/relatorios" element={<ReportsPage />} />
                    <Route path="/configuracoes" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
