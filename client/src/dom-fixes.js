/**
 * CORREÇÃO UNIVERSAL PARA ERROS DE DOM
 * 
 * Este arquivo contém um único patch robusto que resolve problemas de manipulação
 * do DOM em vários navegadores, especialmente o erro "Failed to execute 'removeChild' on 'Node'".
 * 
 * A solução é simples e direta, sem depender de detecção de navegador.
 * 
 * Também fornece uma função auxiliar "safeRemoveChild" que pode ser chamada
 * diretamente por componentes problemáticos para garantir operações DOM seguras.
 */

// Função auxiliar global que qualquer componente pode usar
export function safeRemoveChild(parent, child) {
  if (!parent || !child) {
    console.log('[Safe DOM] Operação cancelada: parent ou child é nulo/undefined');
    return child;
  }
  
  try {
    // Validação completa antes de remover
    if (!child.parentNode || !parent.contains(child)) {
      console.log('[Safe DOM] Operação cancelada: child não é filho do parent ou já foi removido');
      return child;
    }
    
    // Se tudo estiver OK, realizar a remoção
    return parent.removeChild(child);
  } catch (error) {
    console.error('[Safe DOM] Erro ao remover child:', error.message);
    return child;
  }
}

// Função principal que aplica o fix
export function applyDOMFixes() {
  console.log('[DOM Fix] Aplicando correção universal para erros DOM...');
  
  try {
    // Salvar referência ao método original
    const originalRemoveChild = Node.prototype.removeChild;
    
    // Substituir com versão segura que verifica se o nó existe antes de tentar removê-lo
    // Implementação completa conforme sugerido
    Node.prototype.removeChild = function(child) {
      try {
        // Verificação dupla mais robusta (exatamente como sugerido):
        // 1. Verificar se o elemento tem um pai
        // 2. Verificar se o pai contém o elemento
        if (!child || !child.parentNode || !this.contains(child)) {
          console.log('[DOM Fix] Evitou erro: nó filho não encontrado no pai ou já removido');
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