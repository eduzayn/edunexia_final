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
  
  // Verificar e copiar o fallback.html para servir como página inicial
  const fallbackPath = path.join(process.cwd(), 'fallback.html');
  const fallbackDestPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
  
  if (fs.existsSync(fallbackPath)) {
    log(`Copiando fallback.html para dist/public/index.html`);
    fs.copyFileSync(fallbackPath, fallbackDestPath);
  } else {
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
    fs.writeFileSync(fallbackDestPath, basicFallback);
    log(`Página de fallback criada com sucesso`);
  }
  
  // Copiar para a raiz dist também
  fs.copyFileSync(fallbackDestPath, path.join(process.cwd(), 'dist', 'index.html'));
  
  // Implementar APIs básicas para evitar 404 nos endpoints críticos
  log(`Criando APIs básicas requeridas pelo Vercel...`);
  
  // API index.js básica
  const apiIndexContent = `
export default function handler(req, res) {
  return res.status(200).json({
    status: "online",
    message: "API em manutenção programada. Por favor, tente novamente em alguns minutos.",
    maintenance: true,
    timestamp: new Date().toISOString()
  });
}
`;
  
  // API login.js básica
  const apiLoginContent = `
export default function handler(req, res) {
  return res.status(503).json({
    status: "maintenance",
    message: "Sistema de autenticação em manutenção programada. Por favor, tente novamente em alguns minutos.",
    maintenance: true,
    timestamp: new Date().toISOString()
  });
}
`;
  
  // Escrever os arquivos de API
  fs.writeFileSync(path.join(process.cwd(), 'dist', 'api', 'index.js'), apiIndexContent);
  fs.writeFileSync(path.join(process.cwd(), 'dist', 'api', 'login.js'), apiLoginContent);
  
  log(`APIs básicas criadas com sucesso`);
  log(`Build concluído com sucesso. Uma página de manutenção e APIs básicas foram configuradas.`);
  
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', `[ERRO FATAL] Erro durante o build: ${error.message}`);
  console.error('\x1b[31m%s\x1b[0m', 'Stack trace:');
  console.error(error);
  process.exit(1);
}
