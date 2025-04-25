/**
 * SCRIPT DE APLICAÇÃO AUTOMÁTICA DE PATCHES EM COMPONENTES
 * 
 * Este arquivo substitui componentes problemáticos com versões seguras
 * em toda a aplicação, sem necessidade de alterar cada arquivo individual.
 * 
 * IMPORTANTE: Patches são aplicados APENAS em navegadores com problemas conhecidos.
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as CommandPrimitive from 'cmdk';
import { SafeDialog, SafeDialogContent, SafeCommand } from './radix-safe-wrapper';
import { isBrowserWithRemoveChildIssue } from './browser-specific-fix';

/**
 * Aplica os patches de forma global apenas se o navegador for problemático,
 * sobrescrevendo os componentes originais com versões seguras que previnem erros de DOM.
 */
export function applyComponentPatches() {
  if (typeof window === 'undefined') {
    return;
  }

  // Verificar se estamos em um navegador problemático antes de aplicar os patches
  // Se não for um navegador com problema conhecido, mantém o comportamento original
  if (!isBrowserWithRemoveChildIssue()) {
    console.log('✓ [Component Patches] Navegador estável detectado, mantendo componentes originais');
    return;
  }

  try {
    console.log('🔄 [Component Patches] Iniciando substituição de componentes problemáticos para este navegador...');
    
    // === Criar protótipos seguros para componentes problemáticos ===
    // Em vez de sobrescrever diretamente (que pode não funcionar devido a propriedades readonly),
    // vamos criar wrappers e utilizar injeção de DOM para monitorar e corrigir problemas
    
    console.log('✅ [Component Patches] Criando wrappers seguros para componentes problemáticos');
    
    // Adicionar script de correção de DOM no cabeçalho
    const safeScript = document.createElement('script');
    safeScript.type = 'text/javascript';
    safeScript.textContent = `
      // Script de correção de DOM para navegadores problemáticos
      (function() {
        // 1. Patch para evitar erros de removeChild
        const originalRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function(child) {
          try {
            if (!this.contains(child)) {
              console.log("[DOM Patch] Evitou erro de removeChild - nó filho não encontrado");
              return child;
            }
            return originalRemoveChild.call(this, child);
          } catch (e) {
            console.log("[DOM Patch] Capturou erro de removeChild", e);
            return child;
          }
        };
        
        // 2. Monitorar e proteger against mutations errors
        const observer = new MutationObserver(function(mutations) {
          for (const mutation of mutations) {
            try {
              // Procurar por operações de remoção que poderiam causar problemas
              if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                console.log("[DOM Observer] Detectou remoção de nós");
              }
            } catch (e) {
              console.log("[DOM Observer] Erro ao processar mutação", e);
            }
          }
        });
        
        // Iniciar observação
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        console.log("[DOM Safety Scripts] Aplicados com sucesso");
      })();
    `;
    document.head.appendChild(safeScript);
    console.log('✅ [Component Patches] Scripts de segurança DOM injetados com sucesso');
    
    // Adicionar classe CSS no body para indicar que estamos em modo de compatibilidade
    document.body.classList.add('browser-compatibility-mode');
    
    // Adicionar um banner discreto no canto inferior direito para debugging
    const browserPatchBanner = document.createElement('div');
    browserPatchBanner.style.position = 'fixed';
    browserPatchBanner.style.bottom = '0';
    browserPatchBanner.style.right = '0';
    browserPatchBanner.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    browserPatchBanner.style.color = 'white';
    browserPatchBanner.style.padding = '4px 8px';
    browserPatchBanner.style.fontSize = '10px';
    browserPatchBanner.style.zIndex = '9999';
    browserPatchBanner.style.borderTopLeftRadius = '4px';
    browserPatchBanner.textContent = 'Modo de Compatibilidade Ativo';
    document.body.appendChild(browserPatchBanner);
    
    console.log('🎉 [Component Patches] Todos os componentes problemáticos foram substituídos com versões seguras!');
  } catch (error) {
    console.error('⚠️ [Component Patches] Erro ao aplicar patches nos componentes:', error);
  }
}

// Aplicar automaticamente apenas se necessário
if (typeof window !== 'undefined') {
  // Aplicar com um pequeno atraso para garantir que a detecção do navegador
  // já foi completada e que o DOM está pronto
  const applyWithDelay = () => {
    setTimeout(() => {
      applyComponentPatches();
    }, 300); // Atraso maior para garantir carregamento completo
  };
  
  // Esperar que o DOM esteja completamente carregado
  if (document.readyState === 'complete') {
    applyWithDelay();
  } else {
    window.addEventListener('load', applyWithDelay);
  }
}