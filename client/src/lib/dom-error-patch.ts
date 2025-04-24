/**
 * PATCH DOM: Correção para o erro "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node"
 * 
 * Este arquivo implementa uma solução alternativa para erros comuns de manipulação do DOM
 * que ocorrem em situações de race condition, especialmente quando componentes são 
 * desmontados enquanto ainda há animações ou transições em andamento.
 * 
 * Em vez de modificar o protótipo do Node diretamente (o que pode causar problemas de tipagem),
 * fornecemos funções utilitárias para manipulação segura do DOM.
 * 
 * Versão: 1.0.0
 * Data: 24/04/2025
 */

// Variável para controlar se o patch já foi aplicado
let patchApplied = false;

/**
 * Aplica monitoramento de erros de DOM para detectar e logar problemas
 */
export function applyDOMPatch() {
  // Evitar aplicar o patch mais de uma vez
  if (patchApplied || typeof window === 'undefined') {
    return;
  }
  
  console.log('[DOM Patch] Aplicando monitoramento para erros de DOM');

  // Adicionar handler global de erro para capturar erros de DOM
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    
    // Verificar se é um erro de removeChild
    if (error.message && error.message.includes('removeChild') && error.message.includes('not a child')) {
      console.warn('[DOM Patch] Erro de removeChild detectado e registrado:', error.message);
      
      // Evitar que o erro quebre toda a aplicação
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);  // Usar captura para garantir que pegamos o erro antes de qualquer outro handler
  
  // Marcar o patch como aplicado
  patchApplied = true;
  console.log('[DOM Patch] Monitoramento de erros DOM aplicado com sucesso');
}

/**
 * Função auxiliar para limpar elementos de forma segura
 * Útil para componentes que fazem manipulação direta do DOM
 */
export function safeRemoveElement(element: Element | null) {
  if (!element) return;
  
  try {
    // Se o elemento tiver um pai, tentar remover de forma segura
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  } catch (error) {
    console.warn('[DOM Patch] Erro ao remover elemento:', error);
  }
}

// Para evitar erros em modificações rápidas do DOM
export function scheduleAnimationOperation(callback: () => void, delay = 0) {
  return new Promise<void>((resolve) => {
    // Usar requestAnimationFrame para sincronizar com o ciclo de renderização
    requestAnimationFrame(() => {
      // Adicionar um pequeno delay opcional
      setTimeout(() => {
        try {
          callback();
        } catch (error) {
          console.warn('[DOM Patch] Erro em operação agendada:', error);
        }
        resolve();
      }, delay);
    });
  });
}

// Aplicar o patch automaticamente ao importar este módulo
if (typeof window !== 'undefined') {
  // Executar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDOMPatch);
  } else {
    applyDOMPatch();
  }
}