import { Request, Response } from "express";
import { pool } from "../db"; 
import { disciplines, contentCompletionStatusEnum } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function listDisciplines(req: Request, res: Response) {
  try {
    const result = await db.select().from(disciplines);
    return res.json(result);
  } catch (error) {
    console.error("Error listing disciplines:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error listing disciplines", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}

export async function createDiscipline(req: Request, res: Response) {
  try {
    const { codigo, nome, cargaHoraria, descricao } = req.body;
    
    if (!codigo || !nome) {
      return res.status(400).json({
        success: false,
        message: "Discipline code and name are required"
      });
    }
    
    // Check if a discipline with the same code already exists
    const existingDiscipline = await db.select()
      .from(disciplines)
      .where(eq(disciplines.code, codigo))
      .limit(1);
    
    if (existingDiscipline.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A discipline with this code already exists"
      });
    }
    
    // Log the schema to confirm column names
    console.log("Disciplines schema:", Object.keys(disciplines));
    
    try {
      // Insert the new discipline
      const [newDiscipline] = await db.insert(disciplines)
        .values({
          code: codigo,
          name: nome,
          workload: cargaHoraria ? Number(cargaHoraria) : 0, // Default value to avoid null
          description: descricao || "",
          syllabus: descricao || "", // Use description as syllabus temporarily
          contentStatus: "incomplete" // Set initial status as incomplete
        })
        .returning();
        
      console.log("Discipline created successfully:", newDiscipline);
      return res.status(201).json({
        success: true,
        data: newDiscipline,
        message: "Discipline created successfully"
      });
    } catch (error) {
      console.error("Detailed error when inserting discipline:", error);
      // Try with different field if it fails
      try {
        const { disciplines } = await import('@shared/schema');
        console.log("Available columns:", disciplines);
        throw error; // Pass the error to the upper handler
      } catch (innerError) {
        console.error("Error importing schema:", innerError);
        throw error; // Pass the original error
      }
    }
    
  } catch (error) {
    console.error("Error creating discipline:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating discipline",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 