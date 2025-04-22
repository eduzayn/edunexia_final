// Definição de tipos compartilhados entre frontend e backend

// Tipo para a resposta de login que inclui o token de autenticação
export interface LoginResponse {
  success: boolean;
  token: string;
  id: number;
  username: string;
  fullName: string;
  email: string;
  portalType: string;
  role: string;
  [key: string]: any; // Permite campos adicionais
}