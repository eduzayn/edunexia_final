/**
 * Script para verificar a integridade dos arquivos de integração Asaas
 * 
 * Este script compara os arquivos originais com as versões protegidas
 * e alerta quando detecta modificações não autorizadas.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Lista de arquivos a serem verificados
const filesToCheck = [
  'asaas-customers-service.ts',
  'asaas-direct-payment-service.ts',
  'asaas-course-payment-service.ts',
  'certification-payment-service.ts',
  'asaas-charges-service.ts'
];

// Caminho para os diretórios
const originalDir = path.join(__dirname, '..');
const protectedDir = __dirname;

// Função para calcular o hash de um arquivo
function calculateFileHash(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(fileContent).digest('hex');
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
    return null;
  }
}

// Função principal para verificar a integridade
function checkFileIntegrity() {
  console.log('=== VERIFICAÇÃO DE INTEGRIDADE DOS ARQUIVOS ASAAS ===');
  console.log('Data da verificação:', new Date().toLocaleString());
  console.log('--------------------------------------------------------');
  
  let allFilesIntact = true;
  
  for (const file of filesToCheck) {
    const originalPath = path.join(originalDir, file);
    const protectedPath = path.join(protectedDir, file);
    
    // Verificar se ambos os arquivos existem
    if (!fs.existsSync(originalPath)) {
      console.error(`ERRO: Arquivo original não encontrado: ${originalPath}`);
      continue;
    }
    
    if (!fs.existsSync(protectedPath)) {
      console.error(`ERRO: Arquivo protegido não encontrado: ${protectedPath}`);
      continue;
    }
    
    // Calcular hashes
    const originalHash = calculateFileHash(originalPath);
    const protectedHash = calculateFileHash(protectedPath);
    
    if (originalHash === protectedHash) {
      console.log(`✅ ÍNTEGRO: ${file}`);
    } else {
      console.log(`⚠️ MODIFICADO: ${file}`);
      console.log(`   Hash Original: ${originalHash}`);
      console.log(`   Hash Esperado: ${protectedHash}`);
      allFilesIntact = false;
    }
  }
  
  console.log('--------------------------------------------------------');
  if (allFilesIntact) {
    console.log('✅ TODOS OS ARQUIVOS ESTÃO ÍNTEGROS');
  } else {
    console.log('⚠️ ATENÇÃO: ALGUNS ARQUIVOS FORAM MODIFICADOS');
    console.log('   Consulte o README.md para instruções sobre como proceder.');
  }
  console.log('--------------------------------------------------------');
}

// Executar verificação
checkFileIntegrity();