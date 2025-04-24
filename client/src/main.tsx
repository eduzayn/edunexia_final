// Importar o patch DOM e o debugger primeiro para garantir que sejam carregados antes de qualquer manipulação do DOM
import { applyDOMPatch } from "./lib/dom-error-patch";
import { activateDOMDebugger } from "./lib/dom-error-debugger";

// Aplicar patch e ativar debugger imediatamente
applyDOMPatch();
activateDOMDebugger();

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
