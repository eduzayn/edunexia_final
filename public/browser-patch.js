/**
 * PATCH GLOBAL DE COMPATIBILIDADE PARA NAVEGADORES COM ERROS DE DOM
 * 
 * Este script corrige erros de removeChild que ocorrem em certos navegadores,
 * substituindo as funções nativas do DOM com versões mais seguras.
 * 
 * DATA: 24/04/2025
 */

(function() {
  console.log('[Browser Patch] Iniciando script de correção DOM...');
  
  // ===== PARTE 1: CORREÇÃO DE ERRO DE REMOVECHILD =====
  try {
    // Salvar referência ao método original
    const originalRemoveChild = Node.prototype.removeChild;
    
    // Substituir com versão segura
    Node.prototype.removeChild = function(child) {
      try {
        // Verificar se o filho realmente existe como filho do nó
        if (!this.contains(child)) {
          console.log('[Browser Patch] Evitou erro de removeChild - nó não encontrado');
          return child; // Retornar o nó sem erro
        }
        
        // Se tudo estiver ok, chamar método original
        return originalRemoveChild.call(this, child);
      } catch (error) {
        // Capturar erros e registrar
        console.log('[Browser Patch] Erro capturado em removeChild:', error.message);
        return child; // Retornar o nó sem propagar o erro
      }
    };
    
    console.log('[Browser Patch] Correção para Node.prototype.removeChild aplicada com sucesso.');
  } catch (error) {
    console.error('[Browser Patch] Falha ao aplicar correção para removeChild:', error);
  }
  
  // ===== PARTE 2: CORREÇÃO DE ERROS EM EVENTOS DO REACT =====
  try {
    // Proteção contra erros de manipulação de eventos em elementos desmontados
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    
    // Manter registro de event listeners que ainda estão válidos
    const validEventListeners = new WeakMap();
    
    // Substituir addEventListener
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      try {
        // Registrar este listener para monitoramento
        if (!validEventListeners.has(this)) {
          validEventListeners.set(this, new Map());
        }
        const listenersForTarget = validEventListeners.get(this);
        if (!listenersForTarget.has(type)) {
          listenersForTarget.set(type, new Set());
        }
        listenersForTarget.get(type).add(listener);
        
        // Chamar o método original
        return originalAddEventListener.call(this, type, listener, options);
      } catch (error) {
        console.log('[Browser Patch] Erro ao adicionar event listener:', error.message);
      }
    };
    
    // Substituir removeEventListener
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      try {
        // Verificar se este listener existe no nosso registro
        if (validEventListeners.has(this) && 
            validEventListeners.get(this).has(type) &&
            validEventListeners.get(this).get(type).has(listener)) {
          
          // Remover do nosso registro
          validEventListeners.get(this).get(type).delete(listener);
          
          // Chamar método original
          return originalRemoveEventListener.call(this, type, listener, options);
        } else {
          // Listener não encontrado, ignorar silenciosamente
          return undefined;
        }
      } catch (error) {
        console.log('[Browser Patch] Erro ao remover event listener:', error.message);
      }
    };
    
    console.log('[Browser Patch] Correção para event listeners aplicada com sucesso.');
  } catch (error) {
    console.error('[Browser Patch] Falha ao aplicar correção para event listeners:', error);
  }
  
  // ===== PARTE 3: MONITORAMENTO E ALERTAS =====
  try {
    // Adicionar indicador visual na interface do usuário
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          const patchIndicator = document.createElement('div');
          patchIndicator.style.position = 'fixed';
          patchIndicator.style.bottom = '0';
          patchIndicator.style.right = '0';
          patchIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          patchIndicator.style.color = 'white';
          patchIndicator.style.fontSize = '10px';
          patchIndicator.style.padding = '2px 6px';
          patchIndicator.style.zIndex = '99999';
          patchIndicator.style.borderTopLeftRadius = '4px';
          patchIndicator.style.fontFamily = 'sans-serif';
          patchIndicator.innerHTML = 'Modo de Compatibilidade';
          document.body.appendChild(patchIndicator);
        } catch (error) {
          console.log('[Browser Patch] Erro ao adicionar indicador visual:', error);
        }
      }, 1000);
    });
    
    console.log('[Browser Patch] Indicador visual configurado com sucesso.');
  } catch (error) {
    console.error('[Browser Patch] Falha ao adicionar indicador visual:', error);
  }
  
  console.log('[Browser Patch] Todas as correções de compatibilidade foram aplicadas com sucesso.');
})();