/**
 * Definições de tipos TypeScript para dom-fixes.js
 * Isso permite que o TypeScript reconheça as funções exportadas
 * e evite erros de tipo.
 */

declare module '*/dom-fixes' {
  /**
   * Função que aplica correções universais para problemas do DOM
   */
  export function applyDOMFixes(): void;
  
  /**
   * Função que remove um nó filho de forma segura
   * @param parent - O nó pai
   * @param child - O nó filho a ser removido
   * @returns O nó filho que foi removido
   */
  export function safeRemoveChild(parent: Node, child: Node): Node;
}