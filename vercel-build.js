#!/usr/bin/env node

// Script de build personalizado para Vercel
// Este script resolve problemas específicos de build no ambiente Vercel
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função de log que deixa as mensagens mais visíveis
const log = (message) => {
  console.log('\x1b[36m%s\x1b[0m', `[VERCEL BUILD] ${message}`);
};

// Função para executar comandos com logs melhores
const runCommand = (command) => {
  log(`Executando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`Comando executado com sucesso: ${command}`);
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[ERRO] Falha ao executar: ${command}`);
    console.error('\x1b[31m%s\x1b[0m', `[ERRO] Mensagem: ${error.message}`);
    return false;
  }
};

log('Iniciando build personalizado para Vercel...');

try {
  // Exibir informações do ambiente
  log(`Diretório de trabalho: ${process.cwd()}`);
  log(`NODE_ENV: ${process.env.NODE_ENV}`);
  log(`Versão do Node: ${process.version}`);
  
  // Listar diretórios importantes
  if (fs.existsSync('./client')) {
    log('Diretório client existe');
    const clientFiles = fs.readdirSync('./client').slice(0, 5);
    log(`Primeiros arquivos em client: ${clientFiles.join(', ')}${clientFiles.length < fs.readdirSync('./client').length ? '...' : ''}`);
  } else {
    log('AVISO: Diretório client não encontrado!');
  }
  
  // Verificar a existência do arquivo index.html
  const indexPath = path.join(process.cwd(), 'client', 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('\x1b[31m%s\x1b[0m', `[ERRO] Arquivo index.html não encontrado em ${indexPath}`);
    process.exit(1);
  }
  log(`Arquivo index.html encontrado em: ${indexPath}`);
  
  // Ler o conteúdo do index.html
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  log(`Conteúdo original de index.html: ${indexContent.substring(0, 100)}...`);
  
  // Corrigir o caminho do main.tsx no index.html
  if (indexContent.includes('src="/src/main.tsx"')) {
    log('Corrigindo caminho do main.tsx no index.html...');
    indexContent = indexContent.replace('src="/src/main.tsx"', 'src="./src/main.tsx"');
    fs.writeFileSync(indexPath, indexContent);
    log('Caminho do main.tsx corrigido com sucesso.');
  }
  
  log(`Conteúdo atualizado de index.html: ${fs.readFileSync(indexPath, 'utf8').substring(0, 100)}...`);
  
  // Verificar existência do arquivo de configuração do Vite em múltiplos locais
  let viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  let viteConfigFound = fs.existsSync(viteConfigPath);
  
  if (!viteConfigFound) {
    log('vite.config.ts não encontrado na raiz, procurando em outros diretórios...');
    
    // Listar arquivos na raiz para debug
    log('Listando arquivos na raiz para debug:');
    const rootFiles = fs.readdirSync(process.cwd());
    log(`Arquivos na raiz: ${rootFiles.join(', ')}`);
    
    // Se não encontrou, tentar criar um arquivo de configuração mínimo
    log('Criando arquivo de configuração do Vite temporário...');
    
    const minimalViteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// Compatibilidade para path no ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'client'),
  base: './', // Usar caminhos relativos
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    }
  }
});
`;
    
    try {
      fs.writeFileSync(viteConfigPath, minimalViteConfig);
      log('Arquivo de configuração do Vite temporário criado com sucesso');
      viteConfigFound = true;
    } catch (err) {
      console.error('\x1b[31m%s\x1b[0m', `[ERRO] Falha ao criar arquivo de configuração temporário: ${err.message}`);
    }
  }
  
  if (!viteConfigFound) {
    throw new Error('Arquivo de configuração do Vite não encontrado e não foi possível criar um temporário');
  }
  
  log(`Arquivo vite.config.ts encontrado/criado em: ${viteConfigPath}`);
  
  // Executar o build do frontend com Vite
  log('Executando build do frontend com Vite...');
  if (!runCommand('npx vite build')) {
    throw new Error('Falha ao executar o build do frontend');
  }
  
  // Compilando arquivos do servidor
  log('Compilando servidor principal...');
  if (!runCommand('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist')) {
    throw new Error('Falha ao compilar o servidor principal');
  }
  
  // Compilando APIs específicas para Vercel
  log('Compilando APIs para serverless...');
  if (!runCommand('npx esbuild server/api/index.js server/api/login.js --platform=node --packages=external --bundle --format=esm --outdir=dist/api')) {
    throw new Error('Falha ao compilar as APIs para serverless');
  }
  
  // Verificar estrutura do diretório dist após o build
  if (fs.existsSync('./dist')) {
    const distFiles = fs.readdirSync('./dist');
    log(`Arquivos em dist: ${distFiles.join(', ')}`);
    
    if (fs.existsSync('./dist/public')) {
      const distPublicFiles = fs.readdirSync('./dist/public');
      log(`Arquivos em dist/public: ${distPublicFiles.join(', ')}`);
    } else {
      log('AVISO: Diretório dist/public não encontrado!');
    }
  } else {
    log('AVISO: Diretório dist não encontrado após o build!');
  }
  
  // Garantir que o index.html esteja disponível no diretório de saída
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    log('Copiando index.html para o diretório dist...');
    const distPublicIndexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
    if (fs.existsSync(distPublicIndexPath)) {
      fs.copyFileSync(distPublicIndexPath, distIndexPath);
      log('index.html copiado com sucesso para dist/');
    } else {
      console.error('\x1b[31m%s\x1b[0m', '[ERRO] Arquivo index.html não encontrado em dist/public/');
      
      // Tentar uma alternativa - copiar diretamente do cliente
      log('Tentando alternativa: copiar index.html do cliente...');
      fs.copyFileSync(indexPath, distIndexPath);
      log('index.html copiado diretamente do cliente para dist/');
    }
  }
  
  log('Build completado com sucesso!');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', `[ERRO FATAL] Erro durante o build: ${error.message}`);
  console.error('\x1b[31m%s\x1b[0m', 'Stack trace:');
  console.error(error.stack);
  process.exit(1);
}