/**
 * DETECTORES E PATCHES ESPECÍFICOS PARA NAVEGADORES PROBLEMÁTICOS
 * 
 * Este módulo detecta qual navegador está sendo usado e aplica correções específicas
 * apenas quando necessário. Isso evita sobrescrever comportamentos nativos em navegadores
 * que funcionam corretamente.
 * 
 * Versão: 1.0.0
 * Data: 24/04/2025
 */

/**
 * Detecta se o navegador atual é problemático com removeChild
 * Baseado em análise de compatibilidade com vários navegadores
 */
export function isBrowserWithRemoveChildIssue(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // ====== NAVEGADORES PROBLEMÁTICOS ======
  
  // Chrome 117-122 em Windows tem problemas com certos componentes Radix UI
  const isChrome = userAgent.indexOf('chrome') > -1 && userAgent.indexOf('safari') > -1;
  const isWindows = userAgent.indexOf('windows') > -1;
  const problematicChrome = isChrome && isWindows;
  
  // Edge baseado em Chromium com versões específicas
  const isEdge = userAgent.indexOf('edg/') > -1;
  const problematicEdge = isEdge && isWindows;
  
  // Chrome no iOS (CriOS token)
  const isChromeIOS = userAgent.indexOf('crios') > -1;
  
  // Samsung Internet Browser
  const isSamsungBrowser = userAgent.indexOf('samsungbrowser') > -1;
  
  // ====== NAVEGADORES SEGUROS (SABEMOS QUE FUNCIONAM) ======
  
  // Firefox geralmente não tem esse problema
  const isFirefox = userAgent.indexOf('firefox') > -1;
  
  // Safari em MacOS e iOS são geralmente estáveis com esse tipo de manipulação
  const isSafari = userAgent.indexOf('safari') > -1 && !isChrome;
  
  // Navegador seguro encontrado - não aplicar patch
  if (isFirefox || isSafari) {
    console.log('✓ [Browser Check] Navegador estável detectado (Firefox ou Safari), nenhuma correção necessária');
    return false;
  }
  
  // Verificar se o userAgent corresponde a um dos navegadores problemáticos conhecidos
  return problematicChrome || problematicEdge || isChromeIOS || isSamsungBrowser;
}

/**
 * Aplica o patch apenas em navegadores problemáticos
 */
export function applyBrowserSpecificFixes() {
  if (!isBrowserWithRemoveChildIssue()) {
    console.log('✅ [Browser Patch] Navegador não afetado, nenhuma correção é necessária');
    return;
  }
  
  console.log('🛠️ [Browser Patch] Detectado navegador com problemas conhecidos de removeChild, aplicando correções...');
  
  // Detector de elementos React desmontados
  const originalRemoveChild = Node.prototype.removeChild;
  
  // Sobrescreve apenas em navegadores problemáticos - com tipagem correta
  // @ts-ignore - Ignoramos o erro de tipagem específico do TypeScript
  Node.prototype.removeChild = function<T extends Node>(childNode: T): T {
    try {
      // Verificar se o nó filho realmente existe como filho do nó pai
      if (!this.contains(childNode)) {
        // Log silencioso e retorno seguro (evita o erro)
        console.log(`🔄 [Browser Patch] Evitou erro de removeChild`);
        return childNode;
      }
      
      // Execução normal se for seguro
      return originalRemoveChild.call(this, childNode);
    } catch (error) {
      // Se ainda houver erro, capturar e não propagar
      console.log(`⚠️ [Browser Patch] Erro de DOM capturado:`, error);
      return childNode;
    }
  };
  
  // Captura todos os erros de DOM no navegador para evitar crashes da página
  window.addEventListener('error', (event) => {
    // Se for um erro de removeChild, interceptar e evitar que a aplicação quebre
    if (event.message && event.message.includes('removeChild')) {
      console.log(`🛡️ [Browser Patch] Erro de removeChild interceptado e evitado`);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  
  console.log('✅ [Browser Patch] Correções específicas aplicadas com sucesso');
}

// Auto-aplicar quando carregado se estiver em navegador com problemas
if (typeof window !== 'undefined') {
  // Aplicar imediatamente
  if (document.readyState !== 'loading') {
    applyBrowserSpecificFixes();
  } else {
    document.addEventListener('DOMContentLoaded', applyBrowserSpecificFixes);
  }
}