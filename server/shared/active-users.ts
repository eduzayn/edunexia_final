// Objeto que armazena os usuários ativos com base no token
const activeUsers: Record<string, any> = {};

// Funções para manipular os usuários ativos
export function getActiveUsers(): Record<string, any> {
  return activeUsers;
}

export function setActiveUser(token: string, user: any): void {
  activeUsers[token] = user;
}

export function removeActiveUser(token: string): void {
  if (activeUsers[token]) {
    delete activeUsers[token];
  }
}

export function getActiveUserByToken(token: string): any {
  return activeUsers[token] || null;
}

export default activeUsers;