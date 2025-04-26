
import { test, expect } from '@playwright/test';

test('página de login deve carregar corretamente', async ({ page }) => {
  await page.goto('/admin');
  
  // Verifica se o título da página é carregado
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  
  // Verifica se os campos de formulário estão presentes
  await expect(page.getByPlaceholder(/usuário/i)).toBeVisible();
  await expect(page.getByPlaceholder(/senha/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
});

test('deve exibir erro ao tentar login com credenciais inválidas', async ({ page }) => {
  await page.goto('/admin');
  
  // Preenche o formulário com credenciais inválidas
  await page.getByPlaceholder(/usuário/i).fill('usuario_invalido');
  await page.getByPlaceholder(/senha/i).fill('senha_invalida');
  await page.getByRole('button', { name: /entrar/i }).click();
  
  // Verifica se a mensagem de erro aparece
  await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({timeout: 5000});
});
