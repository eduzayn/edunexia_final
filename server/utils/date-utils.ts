/**
 * Retorna uma data que representa X meses atrás
 * @param months Número de meses a subtrair da data atual
 * @returns Data formatada como objeto Date
 */
export function getDateXMonthsAgo(months: number): Date {
  const today = new Date();
  return new Date(
    today.getFullYear(),
    today.getMonth() - months,
    today.getDate()
  );
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date Data para formatar
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD)
 * @param date Data para formatar
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}