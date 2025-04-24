/**
 * DOM Error Debugger - Ferramenta avançada para identificação de erros de DOM
 * 
 * Este módulo adiciona instrumentação detalhada para identificar exatamente onde
 * os erros de removeChild estão ocorrendo, registrando a pilha de chamadas completa
 * e fornecendo informações detalhadas sobre o contexto.
 * 
 * Versão: 1.0.0
 * Data: 24/04/2025
 */

// Estado de depuração
let isDebuggerActive = false;
let capturedErrors: Array<{
  message: string;
  timestamp: number;
  stack?: string;
  nodeInfo?: string;
  parentInfo?: string;
}> = [];

/**
 * Ativa o depurador de erros de DOM
 */
export function activateDOMDebugger() {
  if (isDebuggerActive || typeof window === 'undefined') return;
  
  console.log('[DOM Debugger] Inicializando ferramentas de diagnóstico avançado de DOM');
  
  // Patch para o console.error capturar todas as ocorrências de erro de removeChild
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    // Verificar se é um erro de removeChild
    const errorMessage = args.join(' ');
    if (errorMessage.includes('removeChild') && errorMessage.includes('not a child')) {
      // Capturar stack trace
      const stackTrace = new Error().stack || 'Sem stack trace disponível';
      
      capturedErrors.push({
        message: errorMessage,
        timestamp: Date.now(),
        stack: stackTrace
      });
      
      // Log detalhado
      console.warn('[DOM Debugger] Erro de removeChild detectado e registrado!');
      console.warn('[DOM Debugger] Stack trace:', stackTrace);
    }
    
    // Chamar implementação original
    originalConsoleError.apply(console, args);
  };
  
  // Adicionar monitoramento para operações de remoção de nós
  const addNodeOperation = (node: Node, action: string, details: string) => {
    if (!node) return;
    
    try {
      let nodeInfo = '';
      if (node instanceof Element) {
        nodeInfo = `<${node.tagName.toLowerCase()}`;
        if (node.id) nodeInfo += ` id="${node.id}"`;
        if (node.className) nodeInfo += ` class="${node.className}"`;
        nodeInfo += '>';
      } else {
        nodeInfo = String(node);
      }
      
      console.log(`[DOM Debugger] ${action}: ${nodeInfo} - ${details}`);
    } catch (e) {
      console.warn('[DOM Debugger] Erro ao registrar operação:', e);
    }
  };
  
  // Adicionar monitoramento específico para o erro de removeChild
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('removeChild')) {
      event.preventDefault(); // Evitar que o erro quebre a aplicação
      
      // Registrar detalhes do erro
      capturedErrors.push({
        message: event.message,
        timestamp: Date.now(),
        stack: event.error?.stack || 'Sem stack trace disponível'
      });
      
      console.warn('[DOM Debugger] Erro de removeChild interceptado:', event.message);
      console.log('[DOM Debugger] Total de erros capturados:', capturedErrors.length);
    }
  }, true);
  
  isDebuggerActive = true;
  console.log('[DOM Debugger] Depurador de DOM ativado com sucesso');
}

/**
 * Gera um relatório detalhado dos erros de DOM capturados
 */
export function generateDOMErrorReport(): string {
  if (capturedErrors.length === 0) {
    return "Nenhum erro de DOM detectado até o momento.";
  }
  
  let report = `=== RELATÓRIO DE ERROS DE DOM ===\n`;
  report += `Total de erros capturados: ${capturedErrors.length}\n\n`;
  
  capturedErrors.forEach((error, index) => {
    const date = new Date(error.timestamp).toLocaleTimeString();
    report += `[${index + 1}] ${date} - ${error.message}\n`;
    if (error.nodeInfo) report += `Nó: ${error.nodeInfo}\n`;
    if (error.parentInfo) report += `Pai: ${error.parentInfo}\n`;
    if (error.stack) {
      report += "Stack trace:\n";
      report += error.stack.split('\n').map(line => `  ${line}`).join('\n');
      report += "\n";
    }
    report += "\n";
  });
  
  return report;
}

/**
 * Adiciona log no DOM para que possamos ver erros mesmo quando o console não está aberto
 */
export function addDOMErrorLogger() {
  // Criar um elemento para mostrar logs na página
  const loggerDiv = document.createElement('div');
  loggerDiv.style.position = 'fixed';
  loggerDiv.style.bottom = '10px';
  loggerDiv.style.right = '10px';
  loggerDiv.style.zIndex = '9999';
  loggerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  loggerDiv.style.color = '#ff5555';
  loggerDiv.style.padding = '10px';
  loggerDiv.style.borderRadius = '5px';
  loggerDiv.style.maxHeight = '200px';
  loggerDiv.style.overflowY = 'auto';
  loggerDiv.style.fontSize = '12px';
  loggerDiv.style.fontFamily = 'monospace';
  loggerDiv.style.width = '300px';
  loggerDiv.style.display = 'none'; // Inicialmente oculto
  
  // Botão para mostrar/ocultar logs
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Mostrar Logs de DOM';
  toggleButton.style.position = 'fixed';
  toggleButton.style.bottom = '10px';
  toggleButton.style.right = '10px';
  toggleButton.style.zIndex = '10000';
  toggleButton.style.padding = '5px 10px';
  toggleButton.style.fontSize = '12px';
  toggleButton.style.cursor = 'pointer';
  
  toggleButton.addEventListener('click', () => {
    if (loggerDiv.style.display === 'none') {
      loggerDiv.style.display = 'block';
      toggleButton.textContent = 'Ocultar Logs de DOM';
      // Atualizar o conteúdo dos logs ao abrir
      loggerDiv.innerHTML = `<strong>Erros de DOM detectados: ${capturedErrors.length}</strong><br/><br/>`;
      capturedErrors.slice(-5).forEach((error, index) => {
        const date = new Date(error.timestamp).toLocaleTimeString();
        loggerDiv.innerHTML += `<div style="margin-bottom: 5px; border-bottom: 1px solid #555;">[${date}] ${error.message}</div>`;
      });
    } else {
      loggerDiv.style.display = 'none';
      toggleButton.textContent = 'Mostrar Logs de DOM';
    }
  });
  
  document.body.appendChild(loggerDiv);
  document.body.appendChild(toggleButton);
  
  // Interceptar console.error para mostrar no elemento DOM
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    // Chamar implementação original
    originalConsoleError.apply(console, args);
    
    // Verificar se é um erro de removeChild
    const errorMessage = args.join(' ');
    if (errorMessage.includes('removeChild')) {
      const time = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.style.marginBottom = '5px';
      logEntry.style.borderBottom = '1px solid #555';
      logEntry.innerHTML = `[${time}] ${errorMessage}`;
      
      // Adicionar ao início para mostrar os mais recentes no topo
      if (loggerDiv.firstChild) {
        loggerDiv.insertBefore(logEntry, loggerDiv.firstChild);
      } else {
        loggerDiv.appendChild(logEntry);
      }
      
      // Limitar o número de entradas
      if (loggerDiv.children.length > 20) {
        loggerDiv.removeChild(loggerDiv.lastChild!);
      }
      
      // Incrementar contador
      const countElem = loggerDiv.querySelector('strong');
      if (countElem) {
        countElem.textContent = `Erros de DOM detectados: ${capturedErrors.length}`;
      }
    }
  };
}

// Executar automaticamente quando este módulo for importado
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      activateDOMDebugger();
      // Adicionar o logger no DOM após um curto delay
      setTimeout(() => {
        addDOMErrorLogger();
      }, 1000);
    });
  } else {
    activateDOMDebugger();
    // Adicionar o logger no DOM após um curto delay
    setTimeout(() => {
      addDOMErrorLogger();
    }, 1000);
  }
}