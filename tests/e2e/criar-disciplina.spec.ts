import { test, expect } from '@playwright/test';

test.describe('Criação de Disciplina', () => {
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

  test('deve criar uma nova disciplina com sucesso', async ({ page }) => {
    // Navegar para página de criação de disciplinas
    await page.goto('/admin/academico/disciplines/new');
    
    // Gerar código único para a disciplina
    const randomCode = 'DISC' + Math.floor(Math.random() * 10000);
    
    // Preencher formulário de disciplina
    await page.fill('input[name="code"]', randomCode);
    await page.fill('input[name="name"]', 'Disciplina de Teste E2E');
    await page.fill('textarea[name="description"]', 'Descrição da disciplina criada por teste automatizado.');
    await page.fill('input[name="workload"]', '60');
    await page.fill('textarea[name="syllabus"]', 'Ementa da disciplina de teste');
    
    // Enviar formulário
    await page.click('button[type="submit"]');
    
    // Verificar sucesso da operação
    await page.waitForSelector('div[role="status"]');
    const toastMessage = await page.textContent('div[role="status"]');
    expect(toastMessage).toContain('Disciplina criada com sucesso');
    
    // Verificar se foi redirecionado para página de listagem
    await page.waitForURL('**/admin/academico/disciplines');
    
    // Verificar se a disciplina aparece na listagem
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Disciplina de Teste E2E');
  });
});