import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E no projeto EdunexIA
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  
  use: {
    // URL base para todos os testes
    baseURL: process.env.BASE_URL || 'https://d7775755-86d6-46c0-9e80-55092b836808-00-1wokokcfxh045.worf.replit.dev',
    
    // Captura screenshots apenas em falhas
    screenshot: 'only-on-failure',
    
    // Grava vídeo apenas em falhas
    video: 'on-first-retry',
    
    // Coleta traces para depuração
    trace: 'on-first-retry',
  },
  
  // Configuração para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});