/**
 * SISTEMA DE PATCHES PARA NAVEGADORES PROBLEMÁTICOS
 * 
 * Este arquivo aplica uma série de patches para resolver problemas específicos
 * apenas em navegadores que apresentam o erro "Failed to execute 'removeChild' on 'Node'"
 */

// 1. Importar patches específicos para navegadores com problemas
// Este deve ser o primeiro import para garantir que seja aplicado antes de qualquer manipulação DOM
import { applyBrowserSpecificFixes } from "./patches/browser-specific-fix";

// 2. Importar patches de componentes
import { applyComponentPatches } from "./patches/apply-component-patches";

// 3. Importar outros patches para debugging
import { applyDOMPatch } from "./lib/dom-error-patch";
import { activateDOMDebugger } from "./lib/dom-error-debugger";

// Aplicar todos os patches na ordem correta:

// Passo 1: Patches de baixo nível no navegador
applyBrowserSpecificFixes();

// Passo 2: Monitoramento de erros
applyDOMPatch();
activateDOMDebugger();

// Passo 3: Substituir componentes problemáticos com versões seguras
// Executado com delay para garantir que outros módulos foram carregados
setTimeout(() => {
  applyComponentPatches();
}, 100);

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
