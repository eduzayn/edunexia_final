import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";

import NotFound from "@/pages/landing/not-found";
import HomePage from "@/pages/landing/home-page";
import AuthPage from "@/pages/autenticacao/auth-page";
import PortalSelectionPage from "@/pages/autenticacao/portal-selection-page";
import ModulosPage from "@/pages/landing/modulos-page";
import PlanosPage from "@/pages/landing/planos-page";
import CadastroPage from "@/pages/cadastro/cadastro-page";
import CadastroSucessoPage from "@/pages/cadastro/cadastro-sucesso-page";
import SobrePage from "@/pages/landing/sobre-page";
import ContatoPage from "@/pages/landing/contato-page";
import BlogPage from "@/pages/landing/blog-page";
import PrivacidadePage from "@/pages/institucional/privacidade-page";
import ComponentsExamplePage from "@/pages/examples/components-example-page";
import AdminAuthPage from "@/pages/autenticacao/admin-auth-page";
import PoloAuthPage from "@/pages/autenticacao/polo-auth-page";
// import DisciplinesPage from "@/pages/admin/academico/disciplines-page"; // Removido
import CoursesPage from "@/pages/admin/academico/courses-page";
import CourseFormPage from "@/pages/admin/academico/course-form-page";
// Todas as páginas de disciplinas foram removidas para reconstrução
// import DisciplinaContentPage from "@/pages/admin/academico/disciplinas/[id]/content"; // Removido
// import { default as DisciplinasPage } from "@/pages/admin/academico/disciplinas"; // Removido
import InstitutionsPage from "@/pages/admin/institucional/institutions-page";
// import UsersPage from "@/pages/admin/users-page";
import PolosPage from "@/pages/admin/institucional/polos-page";
import PartnersPage from "@/pages/admin/institucional/partners-page";
import FinancialPage from "@/pages/admin/finance/financial-page";
import ReportsPage from "@/pages/admin/relatorios/reports-page";
import NewReportsPage from "@/pages/admin/relatorios/new-reports-page";
// Módulo Financeiro Empresarial
import FinanceiroEmpresarialPage from "@/pages/admin/financeiro-empresarial/index";
import AntecipacaoPage from "@/pages/admin/financeiro-empresarial/antecipacao-page";
import AssinaturasPage from "@/pages/admin/financeiro-empresarial/assinaturas-page";
// Módulo de Matrículas
import EnrollmentsPage from "@/pages/admin/matriculas/enrollments-page";
import NewEnrollmentPage from "@/pages/admin/matriculas/new-enrollment-page";
import AdminPoloNewEnrollmentPage from "@/pages/admin/matriculas/admin-polo-new-enrollment-page";
import PoloEnrollmentsPageAdmin from "@/pages/admin/matriculas/polo-enrollments-page";
import IntegrationsPage from "@/pages/admin/integracoes/integrations-page";
import CertificationTemplatesPage from "@/pages/admin/certification/templates-page";
import CertificationIssuePage from "@/pages/admin/certification/issue-page";
import CertificationSignersPage from "@/pages/admin/certification/signers-page";
// Importação dos módulos CRM e Gestão
// Importações de leads temporariamente removidas para reconstrução do módulo
// import LeadsPage from "@/pages/admin/crm/leads-page";
// import NewLeadPage from "@/pages/admin/crm/new-lead-page";
import LeadsV2Page from "@/pages/admin/crm/leads-v2-page";
import NewLeadV2Page from "@/pages/admin/crm/new-lead-v2-page";
import LeadDetailV2Page from "@/pages/admin/crm/lead-detail-v2-page";
import AsaasClientsPage from "@/pages/admin/crm/asaas-clients-page";
import NewSimplifiedEnrollmentPage from "@/pages/admin/crm/new-simplified-enrollment-page";
import NewSimplifiedEnrollmentCreatePage from "@/pages/admin/crm/new-simplified-enrollment-create-page";
import NewSimplifiedEnrollmentDetailsPage from "@/pages/admin/crm/new-simplified-enrollment-details-page";
import ProductsPage from "@/pages/admin/finance/products-page";
import NewProductPage from "@/pages/admin/finance/new-product-page";
import ChargesPage from "@/pages/admin/finance/charges-page";
import SimpleNewChargePage from "@/pages/admin/finance/simple-new-charge-page";
import AdvancedChargePage from "@/pages/admin/finance/advanced-charge-page";
import SubscriptionChargePage from "@/pages/admin/finance/subscription-charge-page";
import PaymentsPage from "@/pages/admin/finance/payments-page";
import NewPaymentPage from "@/pages/admin/finance/new-payment-page";
import AdminContractsPage from "@/pages/admin/contracts";
import NewContractPage from "@/pages/admin/contracts/new-contract-page";
// Módulo de Comunicação
import InboxPage from "@/pages/admin/inbox";
// Módulo de Pessoas
import RolesPage from "@/pages/admin/pessoas/roles-page";
import RoleDetailPage from "@/pages/admin/pessoas/role-detail-page";
import AbacPermissionsPage from "@/pages/admin/pessoas/abac-permissions-page";
import UsuariosPage from "@/pages/admin/pessoas/usuarios-page";
import UsuarioFormPage from "@/pages/admin/pessoas/usuario-form-page";
// Módulo de Auditoria
import LogsAuditoriaPage from "@/pages/admin/auditoria/logs-auditoria-page";
// Import student pages
import StudentCoursesPage from "@/pages/student/courses-page";
import CourseDetailPage from "@/pages/student/course-detail-page";
// Importações com erro - arquivos não encontrados
// import DisciplineVideoPage from "@/pages/student/discipline-video-page";
// import DisciplinePdfPage from "@/pages/student/discipline-pdf-page";
// import DisciplineEbookPage from "@/pages/student/discipline-ebook-page";
import LibraryPage from "@/pages/student/library-page";
import SecretariaPage from "@/pages/student/secretaria-page";
import CredencialPage from "@/pages/student/credencial-page";
// import LearningPage from "@/pages/student/learning-page";
import StudentFinancialPage from "@/pages/student/financial-page";
// Import das novas páginas do portal do aluno
import StudentInternshipsPage from "@/pages/student/internships-page";
import StudentContractsPage from "@/pages/student/contracts-page";
import StudentCalendarPage from "@/pages/student/calendar-page";
import StudentMessagesPage from "@/pages/student/messages-page";
import StudentProfilePage from "@/pages/student/profile-page";

// Import ebooks pages - comentados pois não existem
// import EbooksIndexPage from "@/pages/admin/ebooks/index";
// import EbooksGeneratePage from "@/pages/admin/ebooks/generate";
// import EbookEditPage from "@/pages/admin/ebooks/[id]/edit";
// import AdvancedGenerateEBookPage from "@/pages/admin/ebooks/advanced-generate";
// Módulo de Sistema
import SecurityPage from "@/pages/admin/sistema/security-page";
import SettingsPage from "@/pages/admin/sistema/settings-page";
import InstitutionSettingsPage from "@/pages/admin/sistema/institution-settings-page";
import PortalAccessControlPage from "@/pages/admin/sistema/portal-access-control-page";
import SystemMaintenancePage from "@/pages/admin/maintenance/system-maintenance-page";
// Import parcerias pages
import PortalDoParceiroPage from "@/pages/admin/parcerias/portal-page";
import CertificacaoAlunosPage from "@/pages/admin/parcerias/certificacao-page";
import SolicitacoesPendentesPage from "@/pages/admin/parcerias/solicitacoes-page";
import RelatoriosPage from "@/pages/admin/parcerias/relatorios-page";
// Import partner pages
import CertificacaoPartnerPage from "@/pages/partner/certificacao/index";
import NovaSolicitacaoPartnerPage from "@/pages/partner/certificacao/nova";
// Import polo pages
import PoloEnrollmentsPage from "@/pages/polo/enrollments-page";
import PoloNewEnrollmentPage from "@/pages/polo/new-enrollment-page";
import PoloStudentsPage from "@/pages/polo/students-page";
import PoloReportsPage from "@/pages/polo/reports-page";
import PoloSettingsPage from "@/pages/polo/settings-page";
import PoloSalesLinksPage from "@/pages/polo/sales-links-page";
// Páginas públicas de cobranças
import PublicChargesPage from "@/pages/public-charges";
import PublicCreateChargePage from "@/pages/public-create-charge";
import SimpleChargesPage from "@/pages/charges";

import { ProtectedRoute } from "./lib/protected-route";
import { useAuth, AuthProvider } from "./hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth">
        {() => {
          if (user) {
            const dashboardPath = `/${user.portalType}/dashboard`;
            // Substituir setLocation diretamente por um componente de redirecionamento
            return <Redirect to={dashboardPath} />;
          }
          return <AuthPage />;
        }}
      </Route>
      <Route path="/portal-selection" component={PortalSelectionPage} />
      <Route path="/admin">
        {() => {
          console.log("Renderizando rota /admin com usuário:", user?.portalType);

          if (user && user.portalType === "admin") {
            console.log("Redirecionando admin para dashboard");
            return <Redirect to="/admin/dashboard" />;
          }
          console.log("Mostrando página de autenticação admin");
          return <AdminAuthPage />;
        }}
      </Route>

      <Route path="/polo">
        {() => {
          if (user && user.portalType === "polo") {
            return <Redirect to="/polo/dashboard" />;
          }
          return <PoloAuthPage />;
        }}
      </Route>

      <Route path="/modulos" component={ModulosPage} />
      <Route path="/planos" component={PlanosPage} />
      <Route path="/cadastro" component={CadastroPage} />
      <Route path="/cadastro-sucesso" component={CadastroSucessoPage} />
      <Route path="/sobre" component={SobrePage} />
      <Route path="/contato" component={ContatoPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/privacidade" component={PrivacidadePage} />
      <Route path="/test-page">
        {() => <div className="p-8 text-center">Página de Teste Funcionando!</div>}
      </Route>
      <Route path="/examples/components" component={ComponentsExamplePage} />
      <Route path="/public-view/charges" component={SimpleChargesPage} />
      <Route path="/create-charge" component={PublicCreateChargePage} />

      {/* Portal do Aluno - Rotas unificadas com verificação consistente */}
      <Route path="/student">
        {() => {
          console.log("Rota /student acessada, redirecionando para dashboard");
          return user?.portalType === "student" 
            ? <Redirect to="/student/dashboard" /> 
            : <Redirect to="/auth" />;
        }}
      </Route>
      <ProtectedRoute path="/student/dashboard" portalType="student" />
      <Route path="/student/courses">
        {() => {
          console.log("Tentando acessar /student/courses - user:", user?.portalType);
          return user?.portalType === "student" ? <StudentCoursesPage /> : <Redirect to="/auth" />;
        }}
      </Route>
      <Route path="/student/courses/:id">
        {() => user?.portalType === "student" ? <CourseDetailPage /> : <Redirect to="/auth" />}
      </Route>
      {/* Rotas comentadas para discipline, pois os componentes não existem
      <Route path="/student/discipline/:id/video/:videoNumber">
        {() => user?.portalType === "student" ? <DisciplineVideoPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/apostila">
        {() => user?.portalType === "student" ? <DisciplinePdfPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/ebook">
        {() => user?.portalType === "student" ? <DisciplineEbookPage /> : <Redirect to="/auth" />}
      </Route>
      */}
      {/* Rotas de avaliações e simulados foram removidas */}
      <Route path="/student/library">
        {() => user?.portalType === "student" ? <LibraryPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/secretaria">
        {() => user?.portalType === "student" ? <SecretariaPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/credencial">
        {() => user?.portalType === "student" ? <CredencialPage /> : <Redirect to="/auth" />}
      </Route>
      {/* <Route path="/student/learning">
        {() => user?.portalType === "student" ? <LearningPage /> : <Redirect to="/auth" />}
      </Route> */}
      <Route path="/student/financial">
        {() => user?.portalType === "student" ? <StudentFinancialPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/financeiro">
        {() => user?.portalType === "student" ? <Redirect to="/student/financial" /> : <Redirect to="/auth" />}
      </Route>
      {/* Novas rotas para o portal do aluno */}
      <Route path="/student/internships">
        {() => user?.portalType === "student" ? <StudentInternshipsPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/contracts">
        {() => user?.portalType === "student" ? <StudentContractsPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/calendar">
        {() => user?.portalType === "student" ? <StudentCalendarPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/messages">
        {() => user?.portalType === "student" ? <StudentMessagesPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/profile">
        {() => user?.portalType === "student" ? <StudentProfilePage /> : <Redirect to="/auth" />}
      </Route>
      {/* Fallback para URLs do student não definidas explicitamente */}
      <Route path="/student/:rest*">
        {() => {
          console.log("Rota de student não encontrada, redirecionando para dashboard");
          return user?.portalType === "student" 
            ? <Redirect to="/student/dashboard" /> 
            : <Redirect to="/auth" />;
        }}
      </Route>
      <ProtectedRoute path="/partner/dashboard" portalType="partner" />
      <Route path="/partner/certificacao">
        {() => user?.portalType === "partner" ? <CertificacaoPartnerPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/partner/certificacao/nova">
        {() => user?.portalType === "partner" ? <NovaSolicitacaoPartnerPage /> : <Redirect to="/auth" />}
      </Route>
      <ProtectedRoute path="/polo/dashboard" portalType="polo" />
      <Route path="/polo/enrollments">
        {() => user?.portalType === "polo" ? <PoloEnrollmentsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/enrollments/new">
        {() => user?.portalType === "polo" ? <PoloNewEnrollmentPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/students">
        {() => user?.portalType === "polo" ? <PoloStudentsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/reports">
        {() => user?.portalType === "polo" ? <PoloReportsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/settings">
        {() => user?.portalType === "polo" ? <PoloSettingsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/sales-links">
        {() => user?.portalType === "polo" ? <PoloSalesLinksPage /> : <Redirect to="/polo" />}
      </Route>
      <ProtectedRoute path="/admin/dashboard" portalType="admin" />
      {/* Novas rotas do módulo de disciplinas reconstruído em inglês */}
      <Route path="/admin/academico/disciplines">
        {() => {
          console.log("Rota /admin/academico/disciplines");
          return user?.portalType === "admin" ? (
            <div className="container py-10">
              <h1 className="text-3xl font-bold mb-8">Gerenciamento de Disciplinas</h1>
              <p className="text-lg mb-4">Este módulo permite gerenciar todas as disciplinas da plataforma.</p>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <a href="/admin/academico/disciplines/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nova Disciplina
                  </a>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Pesquisar disciplinas..." 
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50">
                    <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-1">ID</div>
                      <div className="col-span-3">Código</div>
                      <div className="col-span-4">Nome</div>
                      <div className="col-span-2">Carga Horária</div>
                      <div className="col-span-2">Ações</div>
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {/* Disciplina 1 */}
                    <div className="grid grid-cols-12 px-6 py-4 whitespace-nowrap text-sm">
                      <div className="col-span-1 text-gray-500">1</div>
                      <div className="col-span-3">DISC101</div>
                      <div className="col-span-4 font-medium text-gray-900">Metodologia Científica</div>
                      <div className="col-span-2">60h</div>
                      <div className="col-span-2 flex space-x-2">
                        <a href="/admin/academico/disciplines/1/edit" className="text-indigo-600 hover:text-indigo-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </a>
                        <a href="/admin/academico/disciplines/1/content" className="text-green-600 hover:text-green-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    
                    {/* Disciplina 2 */}
                    <div className="grid grid-cols-12 px-6 py-4 whitespace-nowrap text-sm">
                      <div className="col-span-1 text-gray-500">2</div>
                      <div className="col-span-3">DISC102</div>
                      <div className="col-span-4 font-medium text-gray-900">Fundamentos de Pedagogia</div>
                      <div className="col-span-2">80h</div>
                      <div className="col-span-2 flex space-x-2">
                        <a href="/admin/academico/disciplines/2/edit" className="text-indigo-600 hover:text-indigo-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </a>
                        <a href="/admin/academico/disciplines/2/content" className="text-green-600 hover:text-green-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    
                    {/* Disciplina 3 */}
                    <div className="grid grid-cols-12 px-6 py-4 whitespace-nowrap text-sm">
                      <div className="col-span-1 text-gray-500">3</div>
                      <div className="col-span-3">DISC103</div>
                      <div className="col-span-4 font-medium text-gray-900">Psicologia Educacional</div>
                      <div className="col-span-2">60h</div>
                      <div className="col-span-2 flex space-x-2">
                        <a href="/admin/academico/disciplines/3/edit" className="text-indigo-600 hover:text-indigo-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </a>
                        <a href="/admin/academico/disciplines/3/content" className="text-green-600 hover:text-green-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Clique no ícone de livro para gerenciar o conteúdo pedagógico da disciplina (vídeos, e-books, simulados, etc).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : <Redirect to="/admin" />;
        }}
      </Route>
      <Route path="/admin/academico/disciplines/new">
        {() => user?.portalType === "admin" ? (
          <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6">Nova Disciplina</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-6 mt-4">
                  <div>
                    <label className="text-gray-700 font-medium">Código da Disciplina</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Ex: MAT101" />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium">Nome da Disciplina</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Ex: Matemática Básica" />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium">Carga Horária</label>
                    <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Ex: 60" />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium">Descrição</label>
                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" rows={4} placeholder="Descreva a disciplina..."></textarea>
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <a href="/admin/academico/disciplines" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancelar</a>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar Disciplina</button>
                </div>
              </form>
            </div>
          </div>
        ) : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/academico/disciplines/:id/edit">
        {(params) => user?.portalType === "admin" ? (
          <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6">Editar Disciplina</h1>
            <p className="mb-6 text-gray-600">ID: {params?.id}</p>
            <div className="flex justify-between mb-6">
              <a href="/admin/academico/disciplines" className="text-blue-600 hover:underline flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar para disciplinas
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-6 mt-4">
                  <div>
                    <label className="text-gray-700 font-medium">Código da Disciplina</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Ex: MAT101" defaultValue="DISC123" />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium">Nome da Disciplina</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Ex: Matemática Básica" defaultValue="Exemplo de Disciplina" />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium">Carga Horária</label>
                    <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Ex: 60" defaultValue="80" />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium">Descrição</label>
                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" rows={4} placeholder="Descreva a disciplina..." defaultValue="Esta é uma disciplina de exemplo para mostrar como o formulário de edição funciona."></textarea>
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <a href="/admin/academico/disciplines" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancelar</a>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Atualizar Disciplina</button>
                </div>
              </form>
            </div>
          </div>
        ) : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/academico/disciplines/:id/content">
        {(params) => user?.portalType === "admin" ? (
          <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6">Conteúdo da Disciplina</h1>
            <p className="mb-6 text-gray-600">ID: {params?.id}</p>
            <div className="flex justify-between mb-6">
              <a href="/admin/academico/disciplines" className="text-blue-600 hover:underline flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar para disciplinas
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid gap-8">
                <div>
                  <h2 className="text-xl font-bold mb-4">Gerenciamento de Conteúdo</h2>
                  <p className="text-gray-600 mb-6">Adicione e organize o conteúdo da disciplina</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                      <h3 className="font-bold text-blue-800 mb-2">Videoaulas</h3>
                      <p className="text-sm text-gray-600 mb-4">Gerencie as videoaulas da disciplina</p>
                      <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Ver videoaulas
                      </a>
                    </div>
                    
                    <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                      <h3 className="font-bold text-green-800 mb-2">E-books</h3>
                      <p className="text-sm text-gray-600 mb-4">Gerencie os e-books da disciplina</p>
                      <a href="#" className="text-green-600 hover:underline text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Ver e-books
                      </a>
                    </div>
                    
                    <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                      <h3 className="font-bold text-purple-800 mb-2">Avaliações</h3>
                      <p className="text-sm text-gray-600 mb-4">Gerencie as avaliações da disciplina</p>
                      <a href="#" className="text-purple-600 hover:underline text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Ver avaliações
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : <Redirect to="/admin" />}
      </Route>

      {/* Redirecionamentos das rotas antigas em português */}
      <Route path="/admin/academico/disciplinas">
        {() => {
          console.log("Redirecionando de /admin/academico/disciplinas para /admin/academico/disciplines");
          return <Redirect to="/admin/academico/disciplines" />;
        }}
      </Route>
      <Route path="/admin/academico/disciplinas/:id/content">
        {(params) => {
          console.log(`Redirecionando de /admin/academico/disciplinas/${params?.id}/content para disciplines`);
          return <Redirect to={`/admin/academico/disciplines/${params?.id}/content`} />;
        }}
      </Route>
      <Route path="/admin/disciplines">
        {() => <Redirect to="/admin/academico/disciplines" />}
      </Route>
      <Route path="/admin/courses">
        {() => <Redirect to="/admin/academico/courses" />}
      </Route>
      <Route path="/admin/academico/courses">
        {() => user?.portalType === "admin" ? <CoursesPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas de e-books - comentadas por falta dos componentes
      <Route path="/admin/ebooks">
        {() => user?.portalType === "admin" ? <EbooksIndexPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/ebooks/generate">
        {() => user?.portalType === "admin" ? <EbooksGeneratePage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/ebooks/advanced-generate">
        {() => user?.portalType === "admin" ? <AdvancedGenerateEBookPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/ebooks/:id/edit">
        {() => user?.portalType === "admin" ? <EbookEditPage /> : <Redirect to="/admin" />}
      </Route>
      */}
      <Route path="/admin/courses/new">
        {() => user?.portalType === "admin" ? <CourseFormPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/academico/courses/new">
        {() => user?.portalType === "admin" ? <CourseFormPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/courses/edit/:id">
        {() => user?.portalType === "admin" ? <CourseFormPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/academico/courses/edit/:id">
        {() => user?.portalType === "admin" ? <CourseFormPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/institutions">
        {() => user?.portalType === "admin" ? <InstitutionsPage /> : <Redirect to="/admin" />}
      </Route>
      {/* Rotas de usuários removidas temporariamente */}
      {/* <Route path="/admin/users" exact>
        {() => user?.portalType === "admin" ? <div>Em desenvolvimento</div> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/users/new">
        {() => user?.portalType === "admin" ? <div>Em desenvolvimento</div> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/users/:id">
        {() => user?.portalType === "admin" ? <div>Em desenvolvimento</div> : <Redirect to="/admin" />}
      </Route> */}
      <Route path="/admin/polos">
        {() => user?.portalType === "admin" ? <PolosPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/partners">
        {() => user?.portalType === "admin" ? <PartnersPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/financial">
        {() => user?.portalType === "admin" ? <FinancialPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo Financeiro Empresarial */}
      <Route path="/admin/financeiro-empresarial">
        {() => user?.portalType === "admin" ? <FinanceiroEmpresarialPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/financeiro-empresarial/antecipacao">
        {() => user?.portalType === "admin" ? <AntecipacaoPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/financeiro-empresarial/assinaturas">
        {() => user?.portalType === "admin" ? <AssinaturasPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo CRM - Matrículas Simplificadas */}
      <Route path="/admin/crm/new-simplified-enrollments">
        {() => user?.portalType === "admin" ? <NewSimplifiedEnrollmentPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/new-simplified-enrollments/create">
        {() => user?.portalType === "admin" ? <NewSimplifiedEnrollmentCreatePage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/new-simplified-enrollments/:id">
        {() => user?.portalType === "admin" ? <NewSimplifiedEnrollmentDetailsPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Matrículas */}
      <Route path="/admin/enrollments">
        {() => user?.portalType === "admin" ? <EnrollmentsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/enrollments/new">
        {() => user?.portalType === "admin" ? <NewEnrollmentPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/polo-enrollments">
        {() => user?.portalType === "admin" ? <PoloEnrollmentsPageAdmin /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/polo-enrollments/new">
        {() => user?.portalType === "admin" ? <AdminPoloNewEnrollmentPage /> : <Redirect to="/admin" />}
      </Route>
      {/* Rotas do Módulo de Relatórios */}
      <Route path="/admin/reports">
        {() => user?.portalType === "admin" ? <ReportsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/reports/new">
        {() => user?.portalType === "admin" ? <NewReportsPage /> : <Redirect to="/admin" />}
      </Route>
      {/* Rotas do Módulo de Integrações */}
      <Route path="/admin/integrations">
        {() => user?.portalType === "admin" ? <IntegrationsPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Certificação */}
      <Route path="/admin/certification/templates">
        {() => user?.portalType === "admin" ? <CertificationTemplatesPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/certification/issue">
        {() => user?.portalType === "admin" ? <CertificationIssuePage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/certification/signers">
        {() => user?.portalType === "admin" ? <CertificationSignersPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Parcerias (Portal do Parceiro) */}
      <Route path="/admin/parcerias/portal">
        {() => user?.portalType === "admin" ? <PortalDoParceiroPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/parcerias/certificacao">
        {() => user?.portalType === "admin" ? <CertificacaoAlunosPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/parcerias/solicitacoes">
        {() => user?.portalType === "admin" ? <SolicitacoesPendentesPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/parcerias/relatorios">
        {() => user?.portalType === "admin" ? <RelatoriosPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo CRM */}
      {/* Rotas de leads temporariamente removidas para reconstrução do módulo */}
      <Route path="/admin/crm/leads">
        {() => user?.portalType === "admin" ? <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Módulo de Leads em Reconstrução</h1>
          <p className="mb-2">Estamos reconstruindo o módulo de leads com integração ao Asaas Checkout.</p>
          <p className="mb-4">Esta nova versão permitirá enviar links de pagamento diretamente para leads e converter automaticamente em clientes após o pagamento.</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Durante a atualização, você pode continuar gerenciando clientes pela área de <a href="/admin/crm/clients" className="font-medium underline text-yellow-700 hover:text-yellow-600">Clientes</a>.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Teste a <a href="/admin/crm/leads-v2" className="font-medium underline text-blue-700 hover:text-blue-600">nova versão</a> do módulo de leads com integração Asaas. (Versão Prévia)
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Previsão de disponibilidade oficial: Em breve</p>
        </div> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/leads/new">
        {() => user?.portalType === "admin" ? <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Novo Sistema de Leads com Asaas Checkout</h1>
          <p className="mb-2">Estamos implementando um novo fluxo para captura e conversão de leads:</p>

          <ol className="list-decimal pl-8 mb-4 space-y-2">
            <li>Cadastro de leads com informações básicas</li>
            <li>Geração de links de pagamento do Asaas</li>
            <li>O lead recebe o link e completa seus próprios dados</li>
            <li>Após o pagamento, conversão automática para cliente</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Este novo sistema eliminará a necessidade de cobranças manuais e reduzirá erros de digitação de dados dos clientes.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">Obrigado pela sua paciência durante esta transição.</p>
        </div> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/checkout">
        {() => user?.portalType === "admin" ? <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Links de Checkout Asaas</h1>
          <p className="mb-4">A funcionalidade de geração de links de pagamento estará disponível em breve nesta área.</p>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 2H8.828a2 2 0 00-1.414.586L6.293 3.707A1 1 0 015.586 4H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Principais benefícios:
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-green-700">
                  <li>Geração de links de pagamento personalizados</li>
                  <li>Cliente preenche os próprios dados no checkout</li>
                  <li>Acompanhamento de status em tempo real</li>
                  <li>Conversão automática para cliente após pagamento</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">Previsão de disponibilidade: Em breve</p>
        </div> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas da nova versão do módulo de leads (V2) */}
      <Route path="/admin/crm/leads-v2">
        {() => user?.portalType === "admin" ? <LeadsV2Page /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/leads/new-v2">
        {() => user?.portalType === "admin" ? <NewLeadV2Page /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/leads/:id/detail-v2">
        {() => user?.portalType === "admin" ? <LeadDetailV2Page /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/crm/asaas-clients">
        {() => user?.portalType === "admin" ? <AsaasClientsPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas de Contato removidas - Substituídas pela Integração Asaas */}

      {/* Rotas do Módulo Financeiro */}
      <Route path="/admin/finance/products">
        {() => user?.portalType === "admin" ? <ProductsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/products/new">
        {() => user?.portalType === "admin" ? <NewProductPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/charges">
        {() => user?.portalType === "admin" ? <ChargesPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/charges/new">
        {() => user?.portalType === "admin" ? <SimpleNewChargePage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/charges/advanced">
        {() => user?.portalType === "admin" ? <AdvancedChargePage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/charges/subscription">
        {() => user?.portalType === "admin" ? <SubscriptionChargePage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/payments">
        {() => user?.portalType === "admin" ? <PaymentsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/finance/payments/new">
        {() => user?.portalType === "admin" ? <NewPaymentPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Comunicação */}
      <Route path="/admin/comunicacao/inbox">
        {() => user?.portalType === "admin" ? <InboxPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/comunicacao/whatsapp">
        {() => user?.portalType === "admin" ? <div>Em breve</div> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/comunicacao/email">
        {() => user?.portalType === "admin" ? <div>Em breve</div> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Contratos */}
      <Route path="/admin/contracts">
        {() => user?.portalType === "admin" ? <AdminContractsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/contracts/new">
        {() => user?.portalType === "admin" ? <NewContractPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Pessoas */}
      <Route path="/admin/pessoas/roles">
        {() => user?.portalType === "admin" ? <RolesPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/pessoas/roles/:id">
        {() => user?.portalType === "admin" ? <RoleDetailPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/pessoas/abac-permissions">
        {() => user?.portalType === "admin" ? <AbacPermissionsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/pessoas/usuarios">
        {() => user?.portalType === "admin" ? <UsuariosPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/pessoas/usuarios/new">
        {() => user?.portalType === "admin" ? <UsuarioFormPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/pessoas/usuarios/:id">
        {() => user?.portalType === "admin" ? <UsuarioFormPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Auditoria */}
      <Route path="/admin/auditoria/logs">
        {() => user?.portalType === "admin" ? <LogsAuditoriaPage /> : <Redirect to="/admin" />}
      </Route>

      {/* Rotas do Módulo de Sistema */}
      <Route path="/admin/sistema/security">
        {() => user?.portalType === "admin" ? <SecurityPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/sistema/settings">
        {() => user?.portalType === "admin" ? <SettingsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/sistema/institution-settings">
        {() => user?.portalType === "admin" ? <InstitutionSettingsPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/sistema/portal-access-control">
        {() => user?.portalType === "admin" ? <PortalAccessControlPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/maintenance/system">
        {() => user?.portalType === "admin" ? <SystemMaintenancePage /> : <Redirect to="/admin" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// Nota: AuthErrorHandler foi removido para evitar redirecionamentos indesejados

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;