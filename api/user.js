// Rota específica para obter o usuário atual em produção
export default function handler(req, res) {
  // Garantir que a resposta seja JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Apenas permitir requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    // Verificar o token no header de Authorization
    const authHeader = req.headers.authorization;
    console.log('[API] GET /api/user - Auth Header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
      console.log('[API] GET /api/user - Token não encontrado');
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado"
      });
    }

    // Simulamos um usuário admin
    const user = {
      id: 18,
      username: 'admin',
      fullName: 'Administrador',
      email: 'admin@edunexa.com',
      portalType: 'admin',
      role: 'admin',
      cpf: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      birthDate: null,
      poloId: null,
      asaasId: null
    };

    console.log('[API] GET /api/user - Retornando usuário');
    return res.status(200).json(user);
  } catch (error) {
    console.error('[API] Erro em GET /api/user:', error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}