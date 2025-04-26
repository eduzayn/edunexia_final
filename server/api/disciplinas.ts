import { Request, Response } from "express";
import { pool } from "../db"; 
import { disciplines } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function listarDisciplinas(req: Request, res: Response) {
  try {
    const resultado = await db.select().from(disciplines);
    return res.json(resultado);
  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao listar disciplinas", 
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
          description: descricao || ""
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
    
    return res.status(201).json({
      success: true,
      data: novaDisciplina,
      message: "Disciplina criada com sucesso"
    });
    
  } catch (error) {
    console.error("Erro ao criar disciplina:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao criar disciplina",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}