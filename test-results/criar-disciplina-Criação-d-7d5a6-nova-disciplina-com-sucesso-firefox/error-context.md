# Test info

- Name: Criação de Disciplina >> deve criar uma nova disciplina com sucesso
- Location: /home/runner/workspace/tests/e2e/criar-disciplina.spec.ts:17:3

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Missing libraries:                                   ║
║     libstdc++.so.6                                   ║
║     libxcb-shm.so.0                                  ║
║     libX11-xcb.so.1                                  ║
║     libX11.so.6                                      ║
║     libxcb.so.1                                      ║
║     libXext.so.6                                     ║
║     libXrandr.so.2                                   ║
║     libXcomposite.so.1                               ║
║     libXcursor.so.1                                  ║
║     libXdamage.so.1                                  ║
║     libXfixes.so.3                                   ║
║     libXi.so.6                                       ║
║     libgtk-3.so.0                                    ║
║     libgdk-3.so.0                                    ║
║     libpangocairo-1.0.so.0                           ║
║     libpango-1.0.so.0                                ║
║     libatk-1.0.so.0                                  ║
║     libcairo-gobject.so.2                            ║
║     libcairo.so.2                                    ║
║     libgdk_pixbuf-2.0.so.0                           ║
║     libgio-2.0.so.0                                  ║
║     libgobject-2.0.so.0                              ║
║     libglib-2.0.so.0                                 ║
║     libXrender.so.1                                  ║
║     libasound.so.2                                   ║
║     libfreetype.so.6                                 ║
║     libfontconfig.so.1                               ║
║     libdbus-1.so.3                                   ║
╚══════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Criação de Disciplina', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Acessar a página de login
   6 |     await page.goto('/login');
   7 |     
   8 |     // Realizar login como admin
   9 |     await page.fill('input[name="username"]', 'admin');
  10 |     await page.fill('input[name="password"]', 'admin123');
  11 |     await page.click('button[type="submit"]');
  12 |     
  13 |     // Esperar redirecionamento para o painel
  14 |     await page.waitForURL('**/admin/dashboard');
  15 |   });
  16 |
> 17 |   test('deve criar uma nova disciplina com sucesso', async ({ page }) => {
     |   ^ Error: browserType.launch: 
  18 |     // Navegar para página de criação de disciplinas
  19 |     await page.goto('/admin/academico/disciplines/new');
  20 |     
  21 |     // Gerar código único para a disciplina
  22 |     const randomCode = 'DISC' + Math.floor(Math.random() * 10000);
  23 |     
  24 |     // Preencher formulário de disciplina
  25 |     await page.fill('input[name="code"]', randomCode);
  26 |     await page.fill('input[name="name"]', 'Disciplina de Teste E2E');
  27 |     await page.fill('textarea[name="description"]', 'Descrição da disciplina criada por teste automatizado.');
  28 |     await page.fill('input[name="workload"]', '60');
  29 |     await page.fill('textarea[name="syllabus"]', 'Ementa da disciplina de teste');
  30 |     
  31 |     // Enviar formulário
  32 |     await page.click('button[type="submit"]');
  33 |     
  34 |     // Verificar sucesso da operação
  35 |     await page.waitForSelector('div[role="status"]');
  36 |     const toastMessage = await page.textContent('div[role="status"]');
  37 |     expect(toastMessage).toContain('Disciplina criada com sucesso');
  38 |     
  39 |     // Verificar se foi redirecionado para página de listagem
  40 |     await page.waitForURL('**/admin/academico/disciplines');
  41 |     
  42 |     // Verificar se a disciplina aparece na listagem
  43 |     const pageContent = await page.textContent('body');
  44 |     expect(pageContent).toContain('Disciplina de Teste E2E');
  45 |   });
  46 | });
```