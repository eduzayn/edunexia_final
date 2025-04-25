/**
 * Utilitários para integração com a Vercel
 */

// Devolve o URL base da aplicação em produção ou desenvolvimento
export function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    // Ambiente de produção da Vercel
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // URL de desenvolvimento padrão
  return 'http://localhost:5000';
}

// Verifica se a aplicação está em execução na Vercel
export function isRunningOnVercel() {
  return process.env.VERCEL === '1';
}

// Identifica o ambiente atual (development, preview, production)
export function getVercelEnvironment() {
  if (!isRunningOnVercel()) {
    return 'development';
  }
  
  return process.env.VERCEL_ENV || 'production';
}

// Helper para lidar com funções serverless (handle timeout, etc)
export function withServerlessConfig(handler) {
  return async (req, res) => {
    // Define timeout para evitar execução infinita
    const timeout = setTimeout(() => {
      res.status(504).json({
        error: 'Timeout',
        message: 'A função serverless excedeu o tempo limite de execução'
      });
    }, 9000); // 9 segundos (limite da Vercel é 10s)
    
    try {
      // Executa o handler original
      await handler(req, res);
    } catch (error) {
      // Tratamento de erro genérico
      console.error('Erro na função serverless:', error);
      
      // Verifica se a resposta já foi enviada
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'production' 
            ? 'Ocorreu um erro interno no servidor' 
            : error.message
        });
      }
    } finally {
      // Limpa o timeout
      clearTimeout(timeout);
    }
  };
}

// Função para adicionar headers comuns de segurança
export function addSecurityHeaders(res) {
  // Cabeçalhos de segurança básicos
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Política de segurança de conteúdo (CSP)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*;"
    );
  }
  
  return res;
} 