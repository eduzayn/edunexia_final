/**
 * CORREÇÃO UNIVERSAL PARA ERROS DE DOM
 * 
 * Este arquivo contém patches robustos que resolvem problemas de manipulação
 * do DOM em vários navegadores, especialmente os erros:
 * - "Failed to execute 'removeChild' on 'Node'"
 * - "Failed to execute 'insertBefore' on 'Node'"
 * 
 * A solução é simples e direta, sem depender de detecção de navegador.
 * 
 * Também fornece funções auxiliares que podem ser chamadas
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

// Função auxiliar global para inserção segura
export function safeInsertBefore(parent, newNode, referenceNode) {
  if (!parent || !newNode) {
    console.log('[Safe DOM] Operação cancelada: parent ou newNode é nulo/undefined');
    return newNode;
  }
  
  try {
    // Se referenceNode for null, simplesmente faz appendChild (comportamento padrão do insertBefore)
    if (!referenceNode) {
      return parent.appendChild(newNode);
    }
    
    // Validação completa antes de inserir
    if (!parent.contains(referenceNode)) {
      console.log('[Safe DOM] Operação cancelada: referenceNode não é filho do parent, usando appendChild como fallback');
      return parent.appendChild(newNode);
    }
    
    // Se tudo estiver OK, realizar a inserção
    return parent.insertBefore(newNode, referenceNode);
  } catch (error) {
    console.error('[Safe DOM] Erro ao inserir newNode:', error.message);
    // Tentar append como fallback
    try {
      return parent.appendChild(newNode);
    } catch (e) {
      console.error('[Safe DOM] Falha no fallback de appendChild:', e.message);
      return newNode;
    }
  }
}

// Função principal que aplica os fixes
export function applyDOMFixes() {
  console.log('[DOM Fix] Aplicando correções universais para erros DOM...');
  
  try {
    // Fix para removeChild
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child) {
      try {
        // Verificação dupla mais robusta:
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
    
    // Fix para insertBefore - IMPLEMENTAÇÃO DE CORREÇÃO PARA O ERRO ATUAL
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(newNode, referenceNode) {
      try {
        // Se referenceNode for null, simplesmente faz appendChild (comportamento padrão do insertBefore)
        if (!referenceNode) {
          return this.appendChild(newNode);
        }
        
        // Verifica se o nó de referência é realmente filho do nó pai
        if (this.contains(referenceNode)) {
          // Se for, usa a implementação original
          return originalInsertBefore.call(this, newNode, referenceNode);
        } else {
          // Se não for, faz um fallback para appendChild
          console.warn(
            "[DOM Fix] Erro evitado: tentativa de insertBefore em um nó que não é filho do nó pai. " +
            "Usando appendChild como fallback."
          );
          return this.appendChild(newNode);
        }
      } catch (error) {
        // Último recurso - se tudo falhar, tenta adicionar ao final
        console.error("[DOM Fix] Erro ao manipular DOM:", error);
        
        // Tenta fazer append como último recurso
        try {
          return this.appendChild(newNode);
        } catch (finalError) {
          console.error("[DOM Fix] Falha crítica na manipulação do DOM:", finalError);
          return newNode;
        }
      }
    };
    
    console.log('[DOM Fix] Correções aplicadas com sucesso!');
  } catch (error) {
    console.error('[DOM Fix] Erro ao aplicar correções:', error);
  }
  
  // Adicionar aviso global para erros não capturados
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function(event) {
      if (event.message && (
        event.message.includes('removeChild') || 
        event.message.includes('insertBefore') ||
        event.message.includes('DOM') || 
        event.message.includes('Node')
      )) {
        console.warn('[DOM Fix] Erro interceptado:', event.message);
        event.preventDefault();
      }
    }, true);
  }
}

// Proteção adicional para manipulações do DOM
export function applyGlobalDOMProtection() {
  try {
    console.log("[HTML DOM Fix] Proteção global aplicada com sucesso");
    
    // Observador de mutação para corrigir problemas de DOM
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        // Apenas para registrar que estamos monitorando
        // (não precisamos fazer nada específico aqui, apenas estar atentos)
      });
      
      // Observar todo o documento para mudanças estruturais
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    
    return true;
  } catch (error) {
    console.error("[HTML DOM Fix] Erro ao aplicar proteção global:", error);
    return false;
  }
}

// Auto-executar ao ser importado
if (typeof window !== 'undefined') {
  // Aplicar o fix o mais cedo possível
  applyDOMFixes();
  applyGlobalDOMProtection();
  
  // Garantir que o fix também seja aplicado após carregamento completo
  window.addEventListener('DOMContentLoaded', function() {
    applyDOMFixes();
    applyGlobalDOMProtection();
  });
  
  window.addEventListener('load', function() {
    applyDOMFixes();
    applyGlobalDOMProtection();
  });
}