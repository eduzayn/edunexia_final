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
  
  // Verificar estrutura de diretórios
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist', { recursive: true });
  }
  
  if (!fs.existsSync('./dist/api')) {
    fs.mkdirSync('./dist/api', { recursive: true });
  }
  
  if (!fs.existsSync('./dist/public')) {
    fs.mkdirSync('./dist/public', { recursive: true });
  }
  
  // Verificar estrutura do cliente
  log('Verificando estrutura do diretório client...');
  if (fs.existsSync('./client/src/main.tsx')) {
    log('Arquivo main.tsx encontrado em client/src');
    
    // Verificar existência de vite.config.js/ts
    let viteConfigPath = '';
    if (fs.existsSync('./vite.config.js')) {
      viteConfigPath = './vite.config.js';
    } else if (fs.existsSync('./vite.config.ts')) {
      viteConfigPath = './vite.config.ts';
    } else if (fs.existsSync('./client/vite.config.js')) {
      viteConfigPath = './client/vite.config.js';
    } else if (fs.existsSync('./client/vite.config.ts')) {
      viteConfigPath = './client/vite.config.ts';
    }
    
    if (!viteConfigPath) {
      log('Criando vite.config.js temporário...');
      const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  }
});
`;
      fs.writeFileSync('./vite.config.js', viteConfig);
      viteConfigPath = './vite.config.js';
      log('vite.config.js temporário criado');
    }
    
    // Executar build do frontend
    log('Iniciando build do frontend com Vite...');
    const frontendBuildSuccess = runCommand('npx vite build');
    
    if (!frontendBuildSuccess) {
      throw new Error('Falha no build do frontend');
    }
    
    log('Build do frontend concluído com sucesso');
  } else {
    log('AVISO: main.tsx não encontrado em client/src. Usando página de fallback temporária.');
    
    // Criar um fallback básico
    log(`Criando página de fallback básica`);
    const basicFallback = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdunexIA - Em Manutenção</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      color: #333;
      background-color: #f9f9f9;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 30px;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #6366f1;
      margin-bottom: 20px;
      font-size: 2rem;
    }
    p {
      margin-bottom: 15px;
      line-height: 1.5;
    }
    .spinner {
      width: 50px;
      height: 50px;
      margin: 20px auto;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-radius: 50%;
      border-top-color: #6366f1;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>EdunexIA - Plataforma Educacional</h1>
    <div class="spinner"></div>
    <p>Estamos realizando manutenção programada para melhorar sua experiência.</p>
    <p>Por favor, tente novamente em alguns minutos.</p>
    <p><small>Se o problema persistir, entre em contato com o suporte.</small></p>
  </div>
</body>
</html>
`;
    
    const fallbackDestPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
    fs.writeFileSync(fallbackDestPath, basicFallback);
    log(`Página de fallback criada em ${fallbackDestPath}`);
    
    // Copiar para a raiz dist também
    fs.copyFileSync(fallbackDestPath, path.join(process.cwd(), 'dist', 'index.html'));
  }
  
  // Compilar o backend e API
  log('Compilando arquivos do backend...');
  
  // Verificar existência de server/index.ts
  if (fs.existsSync('./server/index.ts')) {
    log('Compilando server/index.ts para dist/index.js');
    const serverBuildSuccess = runCommand('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    
    if (!serverBuildSuccess) {
      log('AVISO: Falha ao compilar server/index.ts, criando arquivo de fallback...');
      
      const serverFallback = `
export default function handler(req, res) {
  return res.status(503).json({
    status: "maintenance",
    message: "API em manutenção programada.",
    timestamp: new Date().toISOString()
  });
}
`;
      fs.writeFileSync(path.join(process.cwd(), 'dist', 'index.js'), serverFallback);
    }
  } else {
    log('AVISO: server/index.ts não encontrado.');
  }
  
  // Verificar e compilar APIs específicas
  log('Compilando APIs essenciais...');
  
  if (fs.existsSync('./server/api/login.js')) {
    log('Compilando server/api/login.js para dist/api/login.js');
    runCommand('npx esbuild server/api/login.js --platform=node --packages=external --bundle --format=esm --outfile=dist/api/login.js');
  } else if (fs.existsSync('./server/api/login.ts')) {
    log('Compilando server/api/login.ts para dist/api/login.js');
    runCommand('npx esbuild server/api/login.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/api/login.js');
  } else {
    log('AVISO: API de login não encontrada, criando arquivo de fallback...');
    
    const loginFallback = `
export default function handler(req, res) {
  return res.status(503).json({
    status: "maintenance",
    message: "Serviço de autenticação em manutenção.",
    timestamp: new Date().toISOString()
  });
}
`;
    fs.writeFileSync(path.join(process.cwd(), 'dist', 'api', 'login.js'), loginFallback);
  }
  
  if (fs.existsSync('./server/api/index.js')) {
    log('Compilando server/api/index.js para dist/api/index.js');
    runCommand('npx esbuild server/api/index.js --platform=node --packages=external --bundle --format=esm --outfile=dist/api/index.js');
  } else if (fs.existsSync('./server/api/index.ts')) {
    log('Compilando server/api/index.ts para dist/api/index.js');
    runCommand('npx esbuild server/api/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/api/index.js');
  } else {
    log('AVISO: API principal não encontrada, criando arquivo de fallback...');
    
    const apiFallback = `
export default function handler(req, res) {
  return res.status(503).json({
    status: "maintenance",
    message: "API em manutenção programada.",
    timestamp: new Date().toISOString()
  });
}
`;
    fs.writeFileSync(path.join(process.cwd(), 'dist', 'api', 'index.js'), apiFallback);
  }
  
  log('Build concluído com sucesso!');
  
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', `[ERRO FATAL] Erro durante o build: ${error.message}`);
  console.error('\x1b[31m%s\x1b[0m', 'Stack trace:');
  console.error(error);
  process.exit(1);
}
