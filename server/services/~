import OpenAI from "openai";

/**
 * Serviço para geração avançada de conteúdo de e-books usando OpenAI
 */
class AdvancedOpenAIService {
  private openai!: OpenAI;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
    } else {
      console.warn('OPENAI_API_KEY não está configurado. A funcionalidade de geração de conteúdo avançado não funcionará.');
    }
  }

  /**
   * Gera um e-book avançado com base em múltiplas fontes de contexto
   * @param topic Tópico principal do e-book
   * @param disciplineName Nome da disciplina
   * @param description Descrição adicional para o e-book
   * @param contentType Tipo de contexto adicional ('fromScratch', 'fromUrl', 'fromText', 'fromPdf', 'fromSyllabus')
   * @param contentSource Fonte de conteúdo adicional dependendo do tipo
   * @param additionalPrompts Instruções adicionais específicas para a geração
   * @returns Objeto contendo título, conteúdo, descrição e sugestões de imagens
   */
  async generateAdvancedEBook(
    topic: string,
    disciplineName: string,
    description: string,
    contentType: string = 'fromScratch',
    contentSource: string | null = null,
    additionalPrompts: string[] = []
  ): Promise<{
    title: string;
    content: string;
    description: string;
    imagePrompts: string[];
  }> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não está configurado');
    }

    // Criar um prompt base
    let basePrompt = `Crie um e-book educacional avançado e completo sobre "${topic}" para a disciplina "${disciplineName}".

Descrição do e-book: ${description}

`;

    // Adicionar contexto com base no tipo de conteúdo
    if (contentType === 'fromUrl' && contentSource) {
      basePrompt += `Use o conteúdo da URL fornecida como referência principal: ${contentSource}\n\n`;
    } else if (contentType === 'fromText' && contentSource) {
      basePrompt += `Use o texto fornecido como referência principal:\n${contentSource}\n\n`;
    } else if (contentType === 'fromPdf' && contentSource) {
      basePrompt += `O conteúdo foi extraído de um PDF com o nome: ${contentSource}. Use isso como referência principal.\n\n`;
    } else if (contentType === 'fromSyllabus') {
      basePrompt += `Use a ementa da disciplina "${disciplineName}" como base para o conteúdo.\n\n`;
    }

    // Adicionar instruções adicionais
    if (additionalPrompts.length > 0) {
      basePrompt += "Instruções adicionais:\n";
      additionalPrompts.forEach((prompt, index) => {
        basePrompt += `${index + 1}. ${prompt}\n`;
      });
      basePrompt += "\n";
    }

    // Adicionar instruções finais para formatação
    basePrompt += `O e-book deve incluir:
1. Um título cativante e educacional
2. Uma descrição resumida do conteúdo (máximo 150 palavras)
3. Conteúdo completo em formato HTML para facilitar a leitura, com marcações <h1>, <h2>, <h3>, <p>, <ul>, <li>, etc.
4. Pelo menos 5 sugestões de imagens (marcadas como [IMAGEM: descrição detalhada]) que poderiam ser geradas para ilustrar pontos-chave

Retorne a resposta no seguinte formato:
TÍTULO: [título do e-book]
DESCRIÇÃO: [breve descrição]
CONTEÚDO:
[conteúdo HTML completo com marcações semânticas e [IMAGEM: descrições de imagens]]

O texto deve seguir padrões acadêmicos, ser informativo, ter tom profissional e ser adequado para estudantes de nível superior.`;

    try {
      // Usar o modelo gpt-4o para geração avançada
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // o modelo mais recente da OpenAI para conteúdo avançado
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em criação de e-books educacionais avançados com foco em educação superior. Seus e-books são bem estruturados, seguem normas acadêmicas e são preparados para uma apresentação visual atraente, com conteúdo formatado em HTML semântico."
          },
          { role: "user", content: basePrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0].message.content || '';

      // Extrair título
      const titleMatch = content.match(/TÍTULO:\s*(.+?)(?=\nDESCRIÇÃO:|$)/s);
      
      // Extrair descrição
      const descriptionMatch = content.match(/DESCRIÇÃO:\s*(.+?)(?=\nCONTEÚDO:|$)/s);
      
      // Extrair conteúdo
      const contentMatch = content.match(/CONTEÚDO:\s*(.+)$/s);
      const extractedContent = contentMatch ? contentMatch[1].trim() : '';
      
      // Processar conteúdo para remover artefatos de formatação
      const cleanedContent = extractedContent.replace(/```html|```/g, '');
      
      // Extrair sugestões de imagens
      const imageRegex = /\[IMAGEM:\s*(.*?)\]/g;
      const imagePrompts: string[] = [];
      let match;
      while ((match = imageRegex.exec(cleanedContent)) !== null) {
        imagePrompts.push(match[1].trim());
      }

      return {
        title: titleMatch ? titleMatch[1].trim() : 'E-book sobre ' + topic,
        description: descriptionMatch ? descriptionMatch[1].trim() : description,
        content: cleanedContent,
        imagePrompts
      };
    } catch (error) {
      console.error('Erro ao gerar e-book avançado:', error);
      throw new Error('Falha ao gerar conteúdo avançado do e-book');
    }
  }
}

export const advancedOpenaiService = new AdvancedOpenAIService();