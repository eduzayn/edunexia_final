#!/bin/bash
# Script para build customizado no Vercel

echo "Iniciando build personalizado para Vercel..."

# Executar build do Vite (frontend)
echo "Construindo frontend..."
npm run build

# Criar diretório para API
echo "Configurando estrutura de API..."
mkdir -p dist/api

# Compilar arquivos de API para formato ESM
echo "Compilando endpoints de API..."
npx esbuild server/api/index.js server/api/login.js --platform=node --packages=external --bundle --format=esm --outdir=dist/api

# Compilar módulos de autenticação
echo "Compilando módulos de autenticação..."
mkdir -p dist/auth
npx esbuild server/auth/token.js --platform=node --packages=external --bundle --format=esm --outdir=dist/auth

# Copiar arquivo de aliases de módulos
echo "Copiando arquivos de suporte..."
cp server/module-alias.js dist/

# Copiar arquivos estáticos
echo "Copiando arquivos estáticos..."
[ -d "public" ] && cp -r public/* dist/ || echo "Diretório public não encontrado"

echo "Build para Vercel concluído com sucesso!"