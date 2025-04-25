// Rota específica para obter o usuário atual em produção
export default function handler(req, res) {
  // Garantir que a resposta seja JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Permitir CORS para desenvolvimento
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Responder imediatamente a solicitações OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apenas permitir requisições GET para verificar usuário
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    // Logs para depuração - Ver TODOS os cabeçalhos
    console.log('[API] GET /api/user - Todos headers:', JSON.stringify(req.headers));
    
    // Verificar o token no header de Authorization
    const authHeader = req.headers.authorization;
    console.log('[API] GET /api/user - Auth Header:', authHeader);
    
    // Verificar se o token foi enviado via query como fallback
    const queryToken = req.query?.token;
    
    // Usar o token do header ou da query
    const token = (authHeader && authHeader.split(' ')[1]) || queryToken; 

    if (!token) {
      console.log('[API] GET /api/user - Token não encontrado');
      // Retorna usuário simulado para facilitar teste em desenvolvimento
      // Em ambiente de produção, isso seria um erro 401
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] GET /api/user - DESENVOLVIMENTO: Retornando usuário admin simulado');
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
        return res.status(200).json(user);
      } else {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }
    }

    // Em ambiente de produção, verificaríamos o token JWT
    // Aqui, para simplificar, estamos retornando um usuário admin fixo
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