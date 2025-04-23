import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { enrollments, users, courses, institutions } from '@shared/schema';
import { eq, and, like, isNull, isNotNull, gt, lt, desc, or } from 'drizzle-orm';
import { z } from 'zod';

// Schema para validação dos parâmetros de consulta
const reportQueryParamsSchema = z.object({
  institutionId: z.coerce.number().optional(),
  accessStatus: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

/**
 * Gera relatório de acesso ao portal do aluno com filtros
 */
export const getPortalAccessReport = async (req: Request, res: Response) => {
  try {
    // Validar parâmetros de consulta
    const validation = reportQueryParamsSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Parâmetros de consulta inválidos", 
        errors: validation.error.errors 
      });
    }
    
    const params = validation.data;
    
    // Construir condições de filtro
    const whereConditions = [];
    
    // Filtro por instituição
    if (params.institutionId) {
      whereConditions.push(eq(enrollments.institutionId, params.institutionId));
    }
    
    // Filtro por status de acesso
    if (params.accessStatus) {
      switch (params.accessStatus) {
        case 'not_granted':
          whereConditions.push(isNull(enrollments.accessGrantedAt));
          break;
        case 'active':
          // Acesso concedido, não bloqueado, e não expirado (ou sem data de expiração)
          whereConditions.push(isNotNull(enrollments.accessGrantedAt));
          whereConditions.push(
            and(
              or(
                eq(enrollments.status, 'active'),
                eq(enrollments.status, 'pending_payment')
              ),
              or(
                isNull(enrollments.accessExpiresAt),
                gt(enrollments.accessExpiresAt, new Date())
              ),
              or(
                isNull(enrollments.blockExecutedAt),
                and(
                  isNotNull(enrollments.blockEndsAt),
                  lt(enrollments.blockEndsAt, new Date())
                )
              )
            )
          );
          break;
        case 'blocked':
          // Acesso bloqueado e o bloqueio ainda não terminou
          whereConditions.push(isNotNull(enrollments.blockExecutedAt));
          whereConditions.push(
            or(
              isNull(enrollments.blockEndsAt),
              gt(enrollments.blockEndsAt, new Date())
            )
          );
          break;
        case 'expired':
          // Acesso expirado (data de expiração no passado)
          whereConditions.push(isNotNull(enrollments.accessExpiresAt));
          whereConditions.push(lt(enrollments.accessExpiresAt, new Date()));
          break;
      }
    }
    
    // Filtro por termo de busca (nome, email, código)
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      whereConditions.push(
        or(
          like(enrollments.code, searchTerm),
          like(users.fullName, searchTerm),
          like(users.email, searchTerm)
        )
      );
    }
    
    // Construir a consulta com junções necessárias
    let query = db
      .select({
        id: enrollments.id,
        code: enrollments.code,
        studentId: enrollments.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        courseId: enrollments.courseId,
        courseName: courses.name,
        institutionId: enrollments.institutionId,
        institutionName: institutions.name,
        status: enrollments.status,
        accessGrantedAt: enrollments.accessGrantedAt,
        accessExpiresAt: enrollments.accessExpiresAt,
        blockReason: enrollments.blockReason,
        blockExecutedAt: enrollments.blockExecutedAt,
        blockEndsAt: enrollments.blockEndsAt,
        accessStatus: db.sql<string>`CASE 
          WHEN ${enrollments.accessGrantedAt} IS NULL THEN 'not_granted'
          WHEN ${enrollments.blockExecutedAt} IS NOT NULL AND (${enrollments.blockEndsAt} IS NULL OR ${enrollments.blockEndsAt} > NOW()) THEN 'blocked'
          WHEN ${enrollments.accessExpiresAt} IS NOT NULL AND ${enrollments.accessExpiresAt} < NOW() THEN 'expired'
          ELSE 'active'
        END`
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(institutions, eq(enrollments.institutionId, institutions.id));
    
    // Aplicar condições WHERE se houver
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Adicionar ordem e paginação
    const result = await query
      .orderBy(desc(enrollments.updatedAt))
      .limit(params.limit)
      .offset(params.offset);
    
    // Obter contagens para estatísticas
    const totalCount = await db
      .select({ count: db.fn.count() })
      .from(enrollments)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .then(result => Number(result[0].count) || 0);
    
    // Contar por status de acesso para mostrar resumo
    const statusCounts = {
      total: totalCount,
      active: 0,
      blocked: 0,
      expired: 0,
      not_granted: 0
    };
    
    for (const enrollment of result) {
      const status = enrollment.accessStatus as 'active' | 'blocked' | 'expired' | 'not_granted';
      statusCounts[status]++;
    }
    
    res.status(200).json({
      success: true,
      stats: statusCounts,
      enrollments: result,
      pagination: {
        total: totalCount,
        limit: params.limit,
        offset: params.offset
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de acesso:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao gerar relatório de acesso" 
    });
  }
};