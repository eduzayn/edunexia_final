import { Request, Response } from "express";
import { pool } from "../db"; 
import { disciplines, contentCompletionStatusEnum } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function listarDisciplinas(req: Request, res: Response) {
  try {
    const resultado = await db.select().from(disciplines);
    return res.json({
      success: true,
      data: resultado,
      message: "Disciplinas listadas com sucesso"
    });
  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao listar disciplinas", 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    });
  }
}

export async function obterDisciplina(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID da disciplina inválido"
      });
    }
    
    const [disciplina] = await db.select()
      .from(disciplines)
      .where(eq(disciplines.id, id));
    
    if (!disciplina) {
      return res.status(404).json({
        success: false,
        message: "Disciplina não encontrada"
      });
    }
    
    return res.json({
      success: true,
      data: disciplina,
      message: "Disciplina encontrada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao obter disciplina:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao obter disciplina",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

export async function atualizarDisciplina(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { codigo, nome, cargaHoraria, descricao } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID da disciplina inválido"
      });
    }
    
    // Verificar se a disciplina existe
    const [disciplinaExistente] = await db.select()
      .from(disciplines)
      .where(eq(disciplines.id, id));
    
    if (!disciplinaExistente) {
      return res.status(404).json({
        success: false,
        message: "Disciplina não encontrada"
      });
    }
    
    // Verificar se o novo código já está em uso por outra disciplina
    if (codigo && codigo !== disciplinaExistente.code) {
      const [disciplinaComMesmoCodigo] = await db.select()
        .from(disciplines)
        .where(eq(disciplines.code, codigo));
      
      if (disciplinaComMesmoCodigo && disciplinaComMesmoCodigo.id !== id) {
        return res.status(409).json({
          success: false,
          message: "Já existe outra disciplina com este código"
        });
      }
    }
    
    // Preparar dados de atualização
    const dadosAtualizacao: any = {};
    
    if (codigo) dadosAtualizacao.code = codigo;
    if (nome) dadosAtualizacao.name = nome;
    if (cargaHoraria !== undefined) dadosAtualizacao.workload = Number(cargaHoraria);
    if (descricao !== undefined) {
      dadosAtualizacao.description = descricao;
      // Atualizar também o syllabus se a descrição for alterada
      dadosAtualizacao.syllabus = descricao;
    }
    
    // Executar atualização
    const [disciplinaAtualizada] = await db.update(disciplines)
      .set(dadosAtualizacao)
      .where(eq(disciplines.id, id))
      .returning();
    
    return res.json({
      success: true,
      data: disciplinaAtualizada,
      message: "Disciplina atualizada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar disciplina:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar disciplina",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

export async function excluirDisciplina(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID da disciplina inválido"
      });
    }
    
    // Verificar se a disciplina existe
    const [disciplina] = await db.select()
      .from(disciplines)
      .where(eq(disciplines.id, id));
    
    if (!disciplina) {
      return res.status(404).json({
        success: false,
        message: "Disciplina não encontrada"
      });
    }
    
    // Excluir a disciplina
    await db.delete(disciplines)
      .where(eq(disciplines.id, id));
    
    return res.json({
      success: true,
      message: "Disciplina excluída com sucesso"
    });
  } catch (error) {
    console.error("Erro ao excluir disciplina:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao excluir disciplina",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

export async function criarDisciplina(req: Request, res: Response) {
  try {
    const { codigo, nome, cargaHoraria, descricao } = req.body;
    
    if (!codigo || !nome) {
      return res.status(400).json({
        success: false,
        message: "Código e nome da disciplina são obrigatórios"
      });
    }
    
    // Verificar se já existe uma disciplina com o mesmo código
    const disciplinaExistente = await db.select()
      .from(disciplines)
      .where(eq(disciplines.code, codigo))
      .limit(1);
    
    if (disciplinaExistente.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Já existe uma disciplina com este código"
      });
    }
    
    // Visualizar o schema para confirmar os nomes das colunas
    console.log("Schema de disciplines:", Object.keys(disciplines));
    
    try {
      // Inserir a nova disciplina
      const [novaDisciplina] = await db.insert(disciplines)
        .values({
          code: codigo,
          name: nome,
          workload: cargaHoraria ? Number(cargaHoraria) : 0, // Valor default para evitar null
          description: descricao || "",
          syllabus: descricao || "", // Usar a descrição como syllabus temporariamente
          contentStatus: "incomplete" // Definir status inicial como incompleto
        })
        .returning();
        
      console.log("Disciplina criada com sucesso:", novaDisciplina);
      return res.status(201).json({
        success: true,
        data: novaDisciplina,
        message: "Disciplina criada com sucesso"
      });
    } catch (error) {
      console.error("Erro detalhado ao inserir disciplina:", error);
      // Tentar com campo diferente caso falhe
      try {
        const { disciplines } = await import('@shared/schema');
        console.log("Colunas disponíveis:", disciplines);
        throw error; // Repassando o erro para tratamento superior
      } catch (innerError) {
        console.error("Erro ao importar schema:", innerError);
        throw error; // Repassando o erro original
      }
    }
    
  } catch (error) {
    console.error("Erro ao criar disciplina:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao criar disciplina",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}