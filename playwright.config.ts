import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E no projeto EdunexIA
 * @see https://playwright.dev/docs/test-configuration
 * 
 * Configuração otimizada para ambiente Replit
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  
  // Timeout elevado para ambiente cloud
  timeout: 60000, 
  
  use: {
    // URL base para todos os testes
    baseURL: process.env.BASE_URL || 'https://d7775755-86d6-46c0-9e80-55092b836808-00-1wokokcfxh045.worf.replit.dev',
    
    // Configurar navegador para headless
    headless: true,
    
    // Ignorar erros de HTTPS
    ignoreHTTPSErrors: true,
    
    // Captura screenshots apenas em falhas
    screenshot: 'only-on-failure',
    
    // Sem vídeo para economizar recursos
    video: 'off',
    
    // Sem traces para economizar recursos
    trace: 'off',
  },
  
  // Usando configuração mínima para Firefox
  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'browser.cache.disk.enable': false,
            'browser.cache.memory.enable': false
          }
        }
      },
    }
  ],
});