// Rota específica para logout em produção
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
    console.log('[API] Realizando logout');
    
    return res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso"
    });
  } catch (error) {
    console.error('[API] Erro durante logout:', error);
    return res.status(500).json({
      success: false,
      message: "Erro durante logout",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}