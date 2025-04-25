import jwt from 'jsonwebtoken';

// Array de usuários ativos com seus tokens
const activeUsers = [];

// Definir a chave secreta do JWT (deve ser guardada de forma segura no ambiente de produção)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123456789';

// Função para gerar um token JWT
export function generateToken(user) {
  // Criar payload do token
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    portalType: user.portalType,
    role: user.role, // aluno, admin, polo
    iat: Date.now(),
    exp: Date.now() + (86400 * 1000) // Expira em 24 horas
  };

  // Gerar e assinar o token JWT
  const token = jwt.sign(payload, JWT_SECRET);

  // Adicionar à lista de usuários ativos
  activeUsers.push({
    userId: user.id,
    token: token,
    createdAt: new Date()
  });

  return token;
}

// Função para verificar token
export function verifyToken(token) {
  try {
    // Verificar assinatura e expiração do token
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    return null;
  }
}

// Função para obter usuário ativo pelo token
export function getActiveUserByToken(token) {
  try {
    // Verificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }

    // Retornar o usuário baseado no payload do token para facilitar implementação
    return {
      id: decoded.id,
      username: decoded.username,
      fullName: decoded.fullName,
      email: decoded.email,
      portalType: decoded.portalType,
      role: decoded.role
    };
  } catch (error) {
    console.error('Erro ao buscar usuário por token:', error);
    return null;
  }
}

// Função para remover um usuário ativo (logout)
export function removeActiveUser(token) {
  const index = activeUsers.findIndex(u => u.token === token);
  if (index !== -1) {
    activeUsers.splice(index, 1);
    return true;
  }
  return false;
}