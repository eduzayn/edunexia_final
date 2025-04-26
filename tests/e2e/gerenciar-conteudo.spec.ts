import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Conteúdo da Disciplina', () => {
  test.beforeEach(async ({ page }) => {
    // Acessar a página de login
    await page.goto('/login');
    
    // Realizar login como admin
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Esperar redirecionamento para o painel
    await page.waitForURL('**/admin/dashboard');
  });

  test('deve adicionar conteúdo à disciplina e atualizar status de completude', async ({ page }) => {
    // Navegar para página de criação de disciplinas
    await page.goto('/admin/academico/disciplines/new');
    
    // Gerar código único para a disciplina
    const randomCode = 'CONT' + Math.floor(Math.random() * 10000);
    
    // Preencher formulário de disciplina
    await page.fill('input[name="code"]', randomCode);
    await page.fill('input[name="name"]', 'Disciplina para Teste de Conteúdo');
    await page.fill('textarea[name="description"]', 'Descrição da disciplina para teste de adição de conteúdo.');
    await page.fill('input[name="workload"]', '80');
    await page.fill('textarea[name="syllabus"]', 'Ementa da disciplina para teste de adição de conteúdo.');
    
    // Enviar formulário
    await page.click('button[type="submit"]');
    
    // Verificar sucesso da operação
    await page.waitForSelector('div[role="status"]');
    
    // Navegar para a página de disciplinas
    await page.goto('/admin/academico/disciplines');
    
    // Clicar na nova disciplina
    await page.click(`text=${randomCode}`);
    
    // Clicar no botão de gerenciar conteúdo
    await page.click('button:has-text("Gerenciar Conteúdo")');
    
    // Aguardar carregamento da página de gerenciamento de conteúdo
    await page.waitForSelector('.content-manager-container');
    
    // 1. Adicionar video
    await page.click('button:has-text("Adicionar Video")');
    await page.fill('input[name="title"]', 'Video de Teste');
    await page.fill('input[name="url"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.fill('textarea[name="description"]', 'Descrição do vídeo de teste');
    await page.click('button[type="submit"]:has-text("Adicionar Video")');
    
    // Aguardar feedback de sucesso
    await page.waitForSelector('div[role="status"]:has-text("Video adicionado")');
    
    // 2. Adicionar e-book
    await page.click('button:has-text("Adicionar E-book")');
    await page.fill('input[name="title"]', 'E-book de Teste');
    await page.fill('input[name="url"]', 'https://example.com/ebook.pdf');
    await page.fill('textarea[name="description"]', 'Descrição do e-book de teste');
    await page.click('button[type="submit"]:has-text("Adicionar E-book")');
    
    // Aguardar feedback de sucesso
    await page.waitForSelector('div[role="status"]:has-text("E-book adicionado")');
    
    // 3. Adicionar perguntas ao Simulado
    await page.click('button:has-text("Gerenciar Simulado")');
    
    // Adicionar 5 perguntas (requerimento mínimo)
    for (let i = 1; i <= 5; i++) {
      await page.click('button:has-text("Adicionar Questão")');
      await page.fill('input[name="questionText"]', `Questão de simulado ${i}`);
      await page.fill('input[name="option1"]', `Opção A da questão ${i}`);
      await page.fill('input[name="option2"]', `Opção B da questão ${i}`);
      await page.fill('input[name="option3"]', `Opção C da questão ${i}`);
      await page.fill('input[name="option4"]', `Opção D da questão ${i}`);
      await page.selectOption('select[name="correctOption"]', '1');
      await page.click('button[type="submit"]:has-text("Adicionar")');
      
      // Aguardar feedback de sucesso
      await page.waitForSelector('div[role="status"]:has-text("Questão adicionada")');
    }
    
    // Voltar para página de gerenciamento de conteúdo
    await page.click('button:has-text("Voltar")');
    
    // 4. Adicionar perguntas à Avaliação Final
    await page.click('button:has-text("Gerenciar Avaliação Final")');
    
    // Adicionar 10 perguntas (requerimento exato)
    for (let i = 1; i <= 10; i++) {
      await page.click('button:has-text("Adicionar Questão")');
      await page.fill('input[name="questionText"]', `Questão de avaliação final ${i}`);
      await page.fill('input[name="option1"]', `Opção A da questão ${i}`);
      await page.fill('input[name="option2"]', `Opção B da questão ${i}`);
      await page.fill('input[name="option3"]', `Opção C da questão ${i}`);
      await page.fill('input[name="option4"]', `Opção D da questão ${i}`);
      await page.selectOption('select[name="correctOption"]', '1');
      await page.click('button[type="submit"]:has-text("Adicionar")');
      
      // Aguardar feedback de sucesso
      await page.waitForSelector('div[role="status"]:has-text("Questão adicionada")');
    }
    
    // Voltar para página de gerenciamento de conteúdo
    await page.click('button:has-text("Voltar")');
    
    // Verificar se a disciplina agora está completa
    await page.waitForSelector('.completeness-status:has-text("Completo")');
    
    // Verificar se todos os requisitos estão marcados como completos
    const requirementsList = await page.locator('.completeness-requirements li');
    const requirementsCount = await requirementsList.count();
    
    // Deve ter 4 requisitos (vídeo, e-book, simulado, avaliação final)
    expect(requirementsCount).toBe(4);
    
    // Verificar se todos estão marcados como completos
    for (let i = 0; i < requirementsCount; i++) {
      const requirement = requirementsList.nth(i);
      const requirementText = await requirement.textContent();
      expect(requirementText).toContain('✅');
    }
  });
});