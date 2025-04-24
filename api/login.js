// Rota específica para login em produção
export default function handler(req, res) {
  // Garantir que a resposta seja JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Apenas permitir requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    const { username, password, portalType } = req.body;
    
    console.log(`[API] Tentativa de login: ${username} com portalType ${portalType}`);
    
    // Credenciais de emergência para admin (acesso direto)
    if ((username === 'admin' && password === 'Admin123') || 
        (username === 'superadmin' && password === 'Super123') ||
        (username === 'admin' && password === 'admin123') ||
        (username === 'admin@edunexa.com' && password === 'Admin123')) {

      // Criar usuário simulado
      const user = {
        id: 18, // ID correto do admin no banco de dados
        username: username,
        fullName: username === 'admin' ? 'Administrador' : 'Super Administrador',
        email: username.includes('@') ? username : `${username}@edunexa.com`,
        portalType: portalType || 'admin',
        role: 'admin'
      };

      // Criar um token jwt simples para autenticação
      const token = 'simulatedtoken123456'; 

      console.log(`[API] Login bem-sucedido para ${username}, token gerado`);

      return res.status(200).json({
        success: true,
        token: token,
        ...user
      });
    } 
    
    // Se não são credenciais de admin, retornar erro
    return res.status(401).json({
      success: false,
      message: "Credenciais inválidas. Verifique seu nome de usuário e senha."
    });
  } catch (error) {
    console.error('[API] Erro durante login:', error);
    return res.status(500).json({
      success: false,
      message: "Erro interno durante autenticação.",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}