import { describe, it, expect } from '@jest/globals';

describe('Verificação de Completude da Disciplina', () => {
  /**
   * Função mock para verificar completude
   * @param hasVideo Tem vídeo
   * @param hasEbook Tem e-book
   * @param simuladoQuestions Quantidade de questões no simulado
   * @param avaliacaoQuestions Quantidade de questões na avaliação final
   */
  function checkDisciplineCompleteness(
    hasVideo: boolean,
    hasEbook: boolean,
    simuladoQuestions: number,
    avaliacaoQuestions: number
  ) {
    const requirements = {
      hasVideo: hasVideo,
      hasEbook: hasEbook,
      hasSimulado: simuladoQuestions >= 5,
      hasAvaliacaoFinal: avaliacaoQuestions === 10
    };
    
    const isComplete = 
      requirements.hasVideo && 
      requirements.hasEbook && 
      requirements.hasSimulado &&
      requirements.hasAvaliacaoFinal;
    
    return {
      isComplete,
      requirements
    };
  }

  it('deve retornar incompleto quando não há conteúdo', () => {
    const result = checkDisciplineCompleteness(false, false, 0, 0);
    expect(result.isComplete).toBe(false);
    expect(result.requirements.hasVideo).toBe(false);
    expect(result.requirements.hasEbook).toBe(false);
    expect(result.requirements.hasSimulado).toBe(false);
    expect(result.requirements.hasAvaliacaoFinal).toBe(false);
  });

  it('deve retornar incompleto quando falta vídeo', () => {
    const result = checkDisciplineCompleteness(false, true, 5, 10);
    expect(result.isComplete).toBe(false);
    expect(result.requirements.hasVideo).toBe(false);
  });

  it('deve retornar incompleto quando falta e-book', () => {
    const result = checkDisciplineCompleteness(true, false, 5, 10);
    expect(result.isComplete).toBe(false);
    expect(result.requirements.hasEbook).toBe(false);
  });

  it('deve retornar incompleto quando simulado tem menos de 5 questões', () => {
    const result = checkDisciplineCompleteness(true, true, 4, 10);
    expect(result.isComplete).toBe(false);
    expect(result.requirements.hasSimulado).toBe(false);
  });

  it('deve retornar incompleto quando avaliação não tem exatamente 10 questões', () => {
    // Menos de 10 questões
    let result = checkDisciplineCompleteness(true, true, 5, 9);
    expect(result.isComplete).toBe(false);
    expect(result.requirements.hasAvaliacaoFinal).toBe(false);
    
    // Mais de 10 questões
    result = checkDisciplineCompleteness(true, true, 5, 11);
    expect(result.isComplete).toBe(false);
    expect(result.requirements.hasAvaliacaoFinal).toBe(false);
  });

  it('deve retornar completo quando todos os requisitos são atendidos', () => {
    const result = checkDisciplineCompleteness(true, true, 5, 10);
    expect(result.isComplete).toBe(true);
    expect(result.requirements.hasVideo).toBe(true);
    expect(result.requirements.hasEbook).toBe(true);
    expect(result.requirements.hasSimulado).toBe(true);
    expect(result.requirements.hasAvaliacaoFinal).toBe(true);
  });
  
  it('deve aceitar mais de 5 questões no simulado', () => {
    const result = checkDisciplineCompleteness(true, true, 8, 10);
    expect(result.isComplete).toBe(true);
    expect(result.requirements.hasSimulado).toBe(true);
  });
});