/**
 * SISTEMA DE PATCHES PARA NAVEGADORES PROBLEMÁTICOS
 * 
 * NOTA IMPORTANTE: O patch principal agora é carregado diretamente via script no HTML,
 * antes de qualquer código React. Isso é feito para garantir compatibilidade máxima
 * com navegadores problemáticos que apresentam erros de DOM.
 * 
 * Este código abaixo é apenas um backup secundário para garantir que tudo funcione.
 */

// Importamos os patches no topo do arquivo (necessário no JavaScript)
import { applyBrowserSpecificFixes } from "./patches/browser-specific-fix";
import { applyComponentPatches } from "./patches/apply-component-patches";
import { applyDOMPatch } from "./lib/dom-error-patch";
import { activateDOMDebugger } from "./lib/dom-error-debugger";

// Função para aplicar patches secundários do React
function applyReactPatches() {
  console.log('[Patches] Aplicando patches de backup no React...');
  
  // Passo 1: Patches de baixo nível no navegador
  applyBrowserSpecificFixes();
  
  // Passo 2: Monitoramento de erros
  applyDOMPatch();
  activateDOMDebugger();
  
  // Passo 3: Substituir componentes problemáticos com versões seguras
  // Executado com delay para garantir que outros módulos foram carregados
  setTimeout(() => {
    applyComponentPatches();
  }, 200);
}

// Verificar se devemos aplicar os patches
if (typeof window !== 'undefined') {
  // Verificar se o patch global já foi carregado pelo HTML
  const globalPatchApplied = window.hasOwnProperty('BROWSER_COMPATIBILITY_MODE') && 
                            window.BROWSER_COMPATIBILITY_MODE === true;
  
  if (!globalPatchApplied) {
    // Se o patch global não foi aplicado, usar nossos patches internos
    applyReactPatches();
  } else {
    console.log('[Patches] Usando patch global já carregado via HTML');
  }
}

import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
