#!/bin/bash
# Script para build customizado no Vercel

echo "Iniciando build personalizado para Vercel..."

# Garantir que estamos no diretório raiz do projeto
echo "Verificando diretório de trabalho..."
pwd
ls -la

# Executar build do Vite (frontend)
echo "Construindo frontend..."
npm run build

# Criar diretório para API se não existir
echo "Configurando estrutura de API..."
mkdir -p dist/api
mkdir -p dist/server/api
mkdir -p dist/server/auth

# Compilar arquivos de API para formato ESM
echo "Compilando endpoints de API..."
npx esbuild server/api/index.js server/api/login.js --platform=node --packages=external --bundle --format=esm --outdir=dist/server/api

# Compilar módulos de autenticação
echo "Compilando módulos de autenticação..."
npx esbuild server/auth/token.js --platform=node --packages=external --bundle --format=esm --outdir=dist/server/auth

# Copiar arquivo de aliases de módulos
echo "Copiando arquivos de suporte..."
cp server/module-alias.js dist/server/

# Copiar arquivos originais para fallback
echo "Copiando arquivos originais para fallback..."
cp server/api/index.js dist/server/api/
cp server/api/login.js dist/server/api/
cp server/auth/token.js dist/server/auth/

# Copiar arquivos estáticos
echo "Copiando arquivos estáticos..."
[ -d "public" ] && cp -r public/* dist/ || echo "Diretório public não encontrado"

# Verificar se a pasta dist foi criada corretamente
echo "Verificando arquivos de build..."
ls -la dist
ls -la dist/server/api
ls -la dist/server/auth

echo "Build para Vercel concluído com sucesso!"