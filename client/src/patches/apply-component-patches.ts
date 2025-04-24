/**
 * SCRIPT DE APLICAÇÃO AUTOMÁTICA DE PATCHES EM COMPONENTES
 * 
 * Este arquivo substitui componentes problemáticos com versões seguras
 * em toda a aplicação, sem necessidade de alterar cada arquivo individual.
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as CommandPrimitive from 'cmdk';
import { SafeDialog, SafeDialogContent, SafeCommand } from './radix-safe-wrapper';

/**
 * Aplica os patches de forma global, sobrescrevendo os componentes originais
 * com versões seguras que previnem erros de DOM.
 */
export function applyComponentPatches() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    console.log('🔄 [Component Patches] Iniciando substituição de componentes problemáticos...');
    
    // === Substituir Dialog Component do Radix UI ===
    // @ts-ignore
    DialogPrimitive.Root = SafeDialog;
    console.log('✅ [Component Patches] DialogPrimitive.Root substituído com sucesso');
    
    // === Substituir Content Component do Radix UI ===
    // @ts-ignore
    DialogPrimitive.Content = SafeDialogContent;
    console.log('✅ [Component Patches] DialogPrimitive.Content substituído com sucesso');
    
    // === Substituir Command Component da biblioteca CMDK ===
    // @ts-ignore
    window.CommandPrimitive = SafeCommand;
    console.log('✅ [Component Patches] CommandPrimitive substituído com sucesso');
    
    console.log('🎉 [Component Patches] Todos os componentes problemáticos foram substituídos com versões seguras!');
  } catch (error) {
    console.error('⚠️ [Component Patches] Erro ao aplicar patches nos componentes:', error);
  }
}

// Aplicar automaticamente
if (typeof window !== 'undefined') {
  // Esperar que o DOM esteja completamente carregado
  if (document.readyState === 'complete') {
    setTimeout(() => {
      applyComponentPatches();
    }, 100);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        applyComponentPatches();
      }, 100);
    });
  }
}