#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Iniciando build personalizado para Vercel...');

try {
  // Verificar a existência do arquivo index.html
  const indexPath = path.join(process.cwd(), 'client', 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`Erro: Arquivo index.html não encontrado em ${indexPath}`);
    process.exit(1);
  }
  console.log(`Arquivo index.html encontrado em: ${indexPath}`);
  
  // Especificar explicitamente o arquivo de configuração do Vite
  console.log('Executando build do frontend com Vite...');
  execSync('npx vite build --config vite.config.ts', { stdio: 'inherit' });
  
  // Compilando arquivos do servidor
  console.log('Compilando servidor principal...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Compilando APIs específicas para Vercel
  console.log('Compilando APIs para serverless...');
  execSync('npx esbuild server/api/index.js server/api/login.js --platform=node --packages=external --bundle --format=esm --outdir=dist/api', { stdio: 'inherit' });
  
  // Garantir que o index.html esteja disponível no diretório de saída
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    console.log('Copiando index.html para o diretório dist...');
    const distPublicIndexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
    if (fs.existsSync(distPublicIndexPath)) {
      fs.copyFileSync(distPublicIndexPath, distIndexPath);
      console.log('index.html copiado com sucesso para dist/');
    } else {
      console.error('Arquivo index.html não encontrado em dist/public/');
    }
  }
  
  console.log('Build completado com sucesso!');
} catch (error) {
  console.error('Erro durante o build:', error.message);
  process.exit(1);
}