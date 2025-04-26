#!/bin/bash

# Instalar as dependências do Playwright
echo "Instalando dependências do Playwright..."
npx playwright install --with-deps chromium

# Executar todos os testes
echo "Executando todos os testes..."
npx playwright test

# Executar testes específicos
echo "Executando teste de criar disciplina..."
npx playwright test tests/e2e/criar-disciplina.spec.ts

echo "Executando teste de verificar completude..."
npx playwright test tests/e2e/verificar-completude.spec.ts

echo "Executando teste de gerenciar conteúdo..."
npx playwright test tests/e2e/gerenciar-conteudo.spec.ts

echo "Testes concluídos!"