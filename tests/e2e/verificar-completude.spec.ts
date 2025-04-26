import { test, expect } from '@playwright/test';

test.describe('Verificação de Completude de Disciplina', () => {
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

  test('deve exibir o status de completude corretamente para uma disciplina incompleta', async ({ page }) => {
    // Navegar para página de criação de disciplinas
    await page.goto('/admin/academico/disciplines/new');
    
    // Gerar código único para a disciplina
    const randomCode = 'COMP' + Math.floor(Math.random() * 10000);
    
    // Preencher formulário de disciplina
    await page.fill('input[name="code"]', randomCode);
    await page.fill('input[name="name"]', 'Disciplina para Teste de Completude');
    await page.fill('textarea[name="description"]', 'Descrição da disciplina para teste de completude.');
    await page.fill('input[name="workload"]', '40');
    await page.fill('textarea[name="syllabus"]', 'Ementa da disciplina para teste de completude.');
    
    // Enviar formulário
    await page.click('button[type="submit"]');
    
    // Verificar sucesso da operação
    await page.waitForSelector('div[role="status"]');
    
    // Navegar para a página de gerenciamento de conteúdo da disciplina
    await page.goto('/admin/academico/disciplines');
    
    // Clicar no botão de gerenciar conteúdo da nova disciplina
    await page.click(`text=${randomCode}`);
    await page.click('button:has-text("Gerenciar Conteúdo")');
    
    // Aguardar o componente de verificação de completude
    await page.waitForSelector('.completeness-checker');
    
    // Verificar se o status inicial é incompleto
    const statusElement = await page.locator('.completeness-status');
    const statusText = await statusElement.textContent();
    expect(statusText).toContain('Incompleto');
    
    // Verificar se cada requisito está marcado como incompleto
    const requirementsList = await page.locator('.completeness-requirements li');
    const requirementsCount = await requirementsList.count();
    
    // Verificar se temos os 4 requisitos
    expect(requirementsCount).toBe(4);
    
    // Verificar se todos os requisitos estão incompletos
    for (let i = 0; i < requirementsCount; i++) {
      const requirement = requirementsList.nth(i);
      const requirementText = await requirement.textContent();
      expect(requirementText).toContain('❌');
    }
  });
});