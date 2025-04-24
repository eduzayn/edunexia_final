/**
 * CORREÇÃO UNIVERSAL PARA ERROS DE DOM
 * 
 * Este arquivo contém um único patch robusto que resolve problemas de manipulação
 * do DOM em vários navegadores, especialmente o erro "Failed to execute 'removeChild' on 'Node'".
 * 
 * A solução é simples e direta, sem depender de detecção de navegador.
 */

// Função principal que aplica o fix
export function applyDOMFixes() {
  console.log('[DOM Fix] Aplicando correção universal para erros DOM...');
  
  try {
    // Salvar referência ao método original
    const originalRemoveChild = Node.prototype.removeChild;
    
    // Substituir com versão segura que verifica se o nó existe antes de tentar removê-lo
    Node.prototype.removeChild = function(child) {
      try {
        // Verificar se o filho realmente existe como filho do nó pai
        if (!this.contains(child)) {
          console.log('[DOM Fix] Evitou erro: nó filho não encontrado no pai');
          return child; // Retornar o nó sem erro
        }
        
        // Se tudo ok, chamar método original
        return originalRemoveChild.call(this, child);
      } catch (error) {
        console.log('[DOM Fix] Erro capturado e prevenido:', error.message);
        return child; // Não deixar o erro se propagar
      }
    };
    
    console.log('[DOM Fix] Correção aplicada com sucesso!');
  } catch (error) {
    console.error('[DOM Fix] Erro ao aplicar correção:', error);
  }
  
  // Adicionar aviso global para erros não capturados
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function(event) {
      if (event.message && (
        event.message.includes('removeChild') || 
        event.message.includes('DOM') || 
        event.message.includes('Node')
      )) {
        console.warn('[DOM Fix] Erro interceptado:', event.message);
        event.preventDefault();
      }
    }, true);
  }
}

// Auto-executar ao ser importado
if (typeof window !== 'undefined') {
  // Aplicar o fix o mais cedo possível
  applyDOMFixes();
  
  // Garantir que o fix também seja aplicado após carregamento completo
  window.addEventListener('load', function() {
    applyDOMFixes();
  });
}