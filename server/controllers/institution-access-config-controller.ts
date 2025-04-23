import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { institutions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema para validação dos dados de configuração
const institutionAccessConfigSchema = z.object({
  accessType: z.enum(["after_link_completion", "after_payment_confirmation"], {
    required_error: "Tipo de acesso é obrigatório",
  }),
  blockDelayDays: z.coerce.number().min(1, {
    message: "Dias para bloqueio deve ser maior que 0",
  }),
  cancelDelayDays: z.coerce.number().min(1, {
    message: "Dias para cancelamento deve ser maior que 0",
  }),
  institutionId: z.coerce.number().min(1, {
    message: "Instituição é obrigatória",
  }),
});

/**
 * Obtém as configurações de acesso de uma instituição
 */
export const getInstitutionAccessConfig = async (req: Request, res: Response) => {
  try {
    const institutionId = parseInt(req.params.id);
    
    if (isNaN(institutionId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de instituição inválido" 
      });
    }
    
    // Verificar se a instituição existe
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId)
    });
    
    if (!institution) {
      return res.status(404).json({ 
        success: false, 
        message: "Instituição não encontrada" 
      });
    }
    
    // Retornar as configurações da instituição
    res.status(200).json({
      success: true,
      config: {
        accessType: institution.accessType || "after_link_completion",
        blockDelayDays: institution.blockDelayDays || 10,
        cancelDelayDays: institution.cancelDelayDays || 30,
        institutionId
      }
    });
  } catch (error) {
    console.error('Erro ao obter configuração de acesso da instituição:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao obter configuração de acesso da instituição" 
    });
  }
};

/**
 * Atualiza as configurações de acesso de uma instituição
 */
export const updateInstitutionAccessConfig = async (req: Request, res: Response) => {
  try {
    const institutionId = parseInt(req.params.id);
    
    if (isNaN(institutionId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de instituição inválido" 
      });
    }
    
    // Validar dados recebidos
    const validation = institutionAccessConfigSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Dados inválidos", 
        errors: validation.error.errors 
      });
    }
    
    const data = validation.data;
    
    // Verificar se a instituição existe
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId)
    });
    
    if (!institution) {
      return res.status(404).json({ 
        success: false, 
        message: "Instituição não encontrada" 
      });
    }
    
    // Atualizar as configurações da instituição
    await db.update(institutions)
      .set({
        accessType: data.accessType,
        blockDelayDays: data.blockDelayDays,
        cancelDelayDays: data.cancelDelayDays,
        updatedAt: new Date(),
        updatedById: req.user?.id
      })
      .where(eq(institutions.id, institutionId));
    
    // Retornar as configurações atualizadas
    res.status(200).json({
      success: true,
      message: "Configuração de acesso atualizada com sucesso",
      config: {
        accessType: data.accessType,
        blockDelayDays: data.blockDelayDays,
        cancelDelayDays: data.cancelDelayDays,
        institutionId
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração de acesso da instituição:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao atualizar configuração de acesso da instituição" 
    });
  }
};