/**
 * Gera um código único no formato [prefixo]-[número aleatório de 8 dígitos]
 * Verifica a unicidade usando a função isUnique
 */
export async function generateUniqueCode(
  prefix: string,
  isUnique: (code: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  let attempts = 0;
  let code: string;
  
  do {
    // Gerar número aleatório de 8 dígitos
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    code = `${prefix}-${randomNum}`;
    
    // Verificar unicidade
    if (await isUnique(code)) {
      return code;
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  // Se chegou aqui, não conseguiu gerar um código único após várias tentativas
  throw new Error(`Não foi possível gerar um código único após ${maxAttempts} tentativas`);
}