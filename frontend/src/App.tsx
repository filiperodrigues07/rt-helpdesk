import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SuperAdminAuthProvider } from '@/contexts/SuperAdminAuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SuperAdminProtectedRoute } from '@/components/SuperAdminProtectedRoute';
import { ScreenRoute } from '@/components/ScreenRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SCREEN_PERMISSIONS } from '@/utils/screenPermissions';
import { AppLayout } from '@/layouts/AppLayout';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SuperAdminLoginPage } from '@/pages/super-admin/SuperAdminLoginPage';
import { SuperAdminTenantsPage } from '@/pages/super-admin/SuperAdminTenantsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { CustomerFormPage } from '@/pages/CustomerFormPage';
import { CustomerDetailPage } from '@/pages/CustomerDetailPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { KnowledgeBaseArticlePage } from '@/pages/KnowledgeBaseArticlePage';
import { KnowledgeBaseArticleFormPage } from '@/pages/KnowledgeBaseArticleFormPage';
import { KnowledgeBaseImportPage } from '@/pages/KnowledgeBaseImportPage';
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
        <ErrorBoundary>
          <AuthProvider>
            <SuperAdminAuthProvider>
            <TooltipProvider delayDuration={200}>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

                  <Route element={<SuperAdminProtectedRoute />}>
                    <Route element={<SuperAdminLayout />}>
                      <Route path="/super-admin" element={<SuperAdminTenantsPage />} />
                    </Route>
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<DashboardPage />} />

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.chamados} />}>
                        <Route path="/chamados" element={<TicketsPage />} />
                        <Route path="/chamados/novo" element={<CreateTicketPage />} />
                        <Route path="/chamados/:id" element={<TicketDetailPage />} />
                      </Route>

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.agenda} />}>
                        <Route path="/agenda" element={<AgendaPage />} />
                      </Route>

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.clientes} />}>
                        <Route path="/clientes" element={<CustomersPage />} />
                        <Route path="/clientes/novo" element={<CustomerFormPage />} />
                        <Route path="/clientes/:id" element={<CustomerDetailPage />} />
                        <Route path="/clientes/:id/editar" element={<CustomerFormPage />} />
                      </Route>

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.baseConhecimento} />}>
                        <Route path="/base-de-conhecimento" element={<KnowledgeBasePage />} />
                        <Route path="/base-de-conhecimento/novo" element={<KnowledgeBaseArticleFormPage />} />
                        <Route path="/base-de-conhecimento/importar" element={<KnowledgeBaseImportPage />} />
                        <Route path="/base-de-conhecimento/:id" element={<KnowledgeBaseArticlePage />} />
                        <Route path="/base-de-conhecimento/:id/editar" element={<KnowledgeBaseArticleFormPage />} />
                      </Route>

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.equipe} />}>
                        <Route path="/equipe" element={<TeamPage />} />
                      </Route>

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.relatorios} />}>
                        <Route path="/relatorios" element={<ReportsPage />} />
                      </Route>

                      <Route element={<ScreenRoute permission={SCREEN_PERMISSIONS.configuracoes} />}>
                        <Route path="/configuracoes" element={<SettingsPage />} />
                      </Route>

                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
              <Toaster />
            </TooltipProvider>
            </SuperAdminAuthProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
