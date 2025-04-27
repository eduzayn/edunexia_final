import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as disciplineApi from '../../api/disciplines';
import * as pedagogicoApi from '../../api/pedagogico';
import { useParams, Router } from 'wouter';

// Mock necessário para componentes que usam wouter
vi.mock('wouter', () => ({
  useParams: vi.fn().mockReturnValue({ id: '123' }),
  useLocation: vi.fn().mockReturnValue(['/admin/academico/disciplines/123/content', () => {}]),
  Link: vi.fn().mockImplementation(({ children, to }) => <a href={to}>{children}</a>),
  Route: vi.fn().mockImplementation(({ children }) => children),
  Switch: vi.fn().mockImplementation(({ children }) => children),
  Router: vi.fn().mockImplementation(({ children }) => children)
}));

// Mocks de API
vi.mock('../../api/disciplines', () => ({
  getDiscipline: vi.fn().mockResolvedValue({
    id: 123,
    code: 'DISC123',
    name: 'Disciplina de Teste',
    description: 'Uma disciplina para testes de integração',
    workload: 60,
    syllabus: 'Ementa da disciplina'
  }),
  updateDiscipline: vi.fn().mockResolvedValue({
    id: 123,
    code: 'DISC123',
    name: 'Disciplina de Teste Atualizada',
    description: 'Descrição atualizada',
    workload: 80,
    syllabus: 'Ementa atualizada'
  })
}));

vi.mock('../../api/pedagogico', () => ({
  // Vídeos
  getVideos: vi.fn().mockResolvedValue([
    { id: 1, title: 'Vídeo 1', url: 'https://example.com/video1', description: 'Descrição do vídeo 1' }
  ]),
  addVideo: vi.fn().mockResolvedValue({ id: 2, title: 'Novo Vídeo', url: 'https://example.com/video2' }),
  
  // E-books
  getEbooks: vi.fn().mockResolvedValue([
    { id: 1, title: 'E-book 1', url: 'https://example.com/ebook1', description: 'Descrição do e-book 1' }
  ]),
  addEbook: vi.fn().mockResolvedValue({ id: 2, title: 'Novo E-book', url: 'https://example.com/ebook2' }),
  
  // Conteúdo Interativo
  getInteractiveEbooks: vi.fn().mockResolvedValue([
    { id: 1, title: 'Conteúdo 1', url: 'https://example.com/interactive1', description: 'Conteúdo interativo 1' }
  ]),
  
  // Simulados
  getSimulados: vi.fn().mockResolvedValue([
    { id: 1, title: 'Simulado 1', questions: [] }
  ]),
  
  // Avaliações Finais
  getAvaliacoesFinals: vi.fn().mockResolvedValue([
    { id: 1, title: 'Avaliação 1', questions: [] }
  ]),
  
  // Verificação de completude
  checkDisciplineCompleteness: vi.fn().mockResolvedValue({
    hasVideos: true,
    hasEbooks: true,
    hasInteractiveContent: true,
    hasSimulado: true,
    hasAvaliacaoFinal: false,
    completionPercentage: 80
  })
}));

// Componentes que serão testados
import { DisciplineContentManager } from '../../components/disciplines/DisciplineContentManager';
import { CompletenessChecker } from '../../components/disciplines/CompletenessChecker';

describe('Fluxo de Trabalho de Disciplinas - Integração', () => {
  let queryClient: QueryClient;
  
  beforeAll(() => {
    // Configurar o QueryClient para os testes
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        }
      }
    });
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    queryClient.clear();
  });
  
  // Função auxiliar para renderizar componentes com o QueryClient
  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };
  
  it('deve carregar e exibir o gerenciador de conteúdo da disciplina', async () => {
    renderWithClient(<DisciplineContentManager />);
    
    // Verifica se o título está presente
    expect(screen.getByText('Conteúdo da Disciplina')).toBeInTheDocument();
    
    // Verifica se as abas estão presentes
    expect(screen.getByText('Vídeo-aulas')).toBeInTheDocument();
    expect(screen.getByText('E-book Estático')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo Interativo')).toBeInTheDocument();
    expect(screen.getByText('Simulado')).toBeInTheDocument();
    expect(screen.getByText('Avaliação Final')).toBeInTheDocument();
  });
  
  it('deve mostrar o verificador de completude quando solicitado', async () => {
    renderWithClient(<DisciplineContentManager />);
    
    // Verificar o botão "Ver Detalhes"
    const verDetalhesButton = screen.getByText('Ver Detalhes');
    expect(verDetalhesButton).toBeInTheDocument();
    
    // Clicar no botão
    fireEvent.click(verDetalhesButton);
    
    // Verificar se o verificador de completude está visível
    await waitFor(() => {
      // Aqui nos baseamos no conhecimento da implementação do CompletenessChecker,
      // que mostra a porcentagem de completude
      expect(screen.getByText(/Completude:/)).toBeInTheDocument();
    });
  });
  
  it('deve permitir adicionar conteúdo aos diferentes tipos de materiais', async () => {
    // Este teste verifica a integração entre os componentes e as APIs
    renderWithClient(<DisciplineContentManager />);
    
    // 1. Primeiro, acessamos a aba de vídeos (já deve estar selecionada por padrão)
    expect(screen.getByText('Vídeo-aulas da Disciplina')).toBeInTheDocument();
    
    // 2. Tentamos adicionar um novo vídeo
    const addVideoButton = screen.getByText('Adicionar Vídeo-aula');
    fireEvent.click(addVideoButton);
    
    // 3. Preenchemos o formulário de vídeo
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/título/i);
      const urlInput = screen.getByLabelText(/url/i);
      
      fireEvent.change(titleInput, { target: { value: 'Novo Vídeo' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com/video2' } });
      
      const saveButton = screen.getByText('Salvar');
      fireEvent.click(saveButton);
    });
    
    // 4. Verificamos se a API foi chamada corretamente
    await waitFor(() => {
      expect(pedagogicoApi.addVideo).toHaveBeenCalledWith('123', expect.objectContaining({
        title: 'Novo Vídeo',
        url: 'https://example.com/video2'
      }));
    });
    
    // 5. Agora mudamos para a aba de E-books
    const ebookTab = screen.getByText('E-book Estático');
    fireEvent.click(ebookTab);
    
    // 6. Verificamos se a aba de E-books carregou corretamente
    await waitFor(() => {
      expect(screen.getByText('E-books da Disciplina')).toBeInTheDocument();
    });
    
    // 7. Tentamos adicionar um novo e-book
    const addEbookButton = screen.getByText('Adicionar E-book');
    fireEvent.click(addEbookButton);
    
    // 8. Preenchemos o formulário de e-book
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/título/i);
      const urlInput = screen.getByLabelText(/url/i);
      
      fireEvent.change(titleInput, { target: { value: 'Novo E-book' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com/ebook2' } });
      
      const saveButton = screen.getByText('Salvar');
      fireEvent.click(saveButton);
    });
    
    // 9. Verificamos se a API de e-book foi chamada corretamente
    await waitFor(() => {
      expect(pedagogicoApi.addEbook).toHaveBeenCalledWith('123', expect.objectContaining({
        title: 'Novo E-book',
        url: 'https://example.com/ebook2'
      }));
    });
  });
}); 