import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { advancedOpenaiService } from "../services/advanced-openai-service";
import { z } from "zod";

const router = Router();

// Gerar conteúdo avançado para e-book com contexto enriquecido
router.post("/generate-advanced-content", requireAuth, requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      topic: z.string().min(3, "O tópico deve ter pelo menos 3 caracteres"),
      disciplineId: z.number({ required_error: "O ID da disciplina é obrigatório" }),
      description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
      contentType: z.enum(['fromScratch', 'fromUrl', 'fromText', 'fromPdf', 'fromSyllabus']),
      contentSource: z.string().nullable().optional(),
      contentUrl: z.string().url().nullable().optional(),
      contentText: z.string().nullable().optional(),
      additionalPrompts: z.array(z.string()).optional()
    });
    
    const data = schema.parse(req.body);
    
    // Verificar se a disciplina existe
    const discipline = await storage.getDiscipline(data.disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }
    
    // Determinar a fonte de conteúdo correta com base no tipo
    let contentSource: string | null = null;
    
    if (data.contentType === 'fromUrl' && data.contentUrl) {
      contentSource = data.contentUrl;
    } else if (data.contentType === 'fromText' && data.contentText) {
      contentSource = data.contentText;
    } else if ((data.contentType === 'fromPdf' || data.contentType === 'fromSyllabus') && data.contentSource) {
      contentSource = data.contentSource;
    }
    
    // Gerar conteúdo avançado usando o serviço OpenAI
    const eBookContent = await advancedOpenaiService.generateAdvancedEBook(
      data.topic,
      discipline.name,
      data.description,
      data.contentType,
      contentSource,
      data.additionalPrompts || []
    );
    
    // Responder com o conteúdo gerado
    res.json(eBookContent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de requisição inválidos", details: error.errors });
    }
    console.error("Erro ao gerar conteúdo avançado para e-book:", error);
    res.status(500).json({ 
      error: "Erro ao gerar conteúdo avançado para e-book", 
      message: error instanceof Error ? error.message : "Erro desconhecido" 
    });
  }
});

export default router;