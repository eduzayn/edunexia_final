/**
 * FIX UNIVERSAL PARA ERROS DE DOM
 * 
 * Importamos nosso fix universal como primeiro import
 * para garantir que seja aplicado antes de qualquer manipulação DOM
 */

// Importar o fix universal simplificado que funciona em todos os navegadores
import './dom-fixes.js';

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
