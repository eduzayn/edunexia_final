import jwt from 'jsonwebtoken';

// Chave secreta para assinar os tokens JWT
// Idealmente, isso deveria vir de uma variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'edunexa-jwt-secret-key';

// Cache em memória para usuários ativos (evita consultas frequentes ao banco)
// Isso é opcional e pode ser removido se não for necessário
const activeUsers: Record<string, any> = {};

/**
 * Gera um token JWT para o usuário
 * @param user Objeto do usuário
 * @returns Token JWT assinado
 */
export function generateToken(user: any): string {
  // Remove a senha do payload por segurança
  const { password, ...userWithoutPassword } = user;
  
  // Criar payload com informações importantes e tempo de expiração
  const payload = {
    ...userWithoutPassword,
    iat: Date.now(),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expira em 24 horas
  };
  
  // Assinar o token com a chave secreta
  const token = jwt.sign(payload, JWT_SECRET);
  
  // Opcionalmente, armazenar em cache para acesso rápido
  activeUsers[token] = userWithoutPassword;
  
  return token;
}

/**
 * Verifica a validade de um token JWT e extrai as informações do usuário
 * @param token Token JWT a ser verificado
 * @returns Objeto do usuário ou null se o token for inválido
 */
export function getActiveUserByToken(token: string): any {
  try {
    // Primeiro, verificar o cache
    if (activeUsers[token]) {
      return activeUsers[token];
    }
    
    // Se não estiver no cache, verificar o token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Armazenar no cache para uso futuro
    activeUsers[token] = decoded;
    
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

/**
 * Armazena informações do usuário no cache
 * @param token Token JWT do usuário
 * @param user Objeto do usuário
 */
export function setActiveUser(token: string, user: any): void {
  // Remove a senha por segurança
  const { password, ...userWithoutPassword } = user;
  activeUsers[token] = userWithoutPassword;
}

/**
 * Remove o usuário do cache
 * @param token Token JWT do usuário
 */
export function removeActiveUser(token: string): void {
  if (activeUsers[token]) {
    delete activeUsers[token];
  }
}

/**
 * Retorna todos os usuários ativos (apenas para fins de depuração)
 * @returns Objeto com todos os usuários ativos
 */
export function getActiveUsers(): Record<string, any> {
  return activeUsers;
}

export default activeUsers;