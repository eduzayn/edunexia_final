/**
 * AVISO DE PROTEÇÃO: Este arquivo contém lógica crítica para o sistema de matrículas simplificadas.
 * Não faça alterações neste código a menos que seja absolutamente necessário.
 * Qualquer modificação requer aprovação e deve ser feita com extremo cuidado.
 * Data de estabilização: 23/04/2025
 * 
 * Este controlador gerencia todas as operações de CRUD para matrículas simplificadas e
 * implementa integrações críticas com serviços de pagamento.
 */

import { Request, Response } from 'express';
import { db, pool } from '../db';
// Usar o schema do servidor que corresponde à estrutura atual do banco de dados
import { simplifiedEnrollments } from '../db/schema';
import { courses, polos, institutions, insertSimplifiedEnrollmentSchema } from '../../shared/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';
import { AsaasDirectPaymentService } from '../services/asaas-direct-payment-service';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Lista todas as matrículas simplificadas com filtros e paginação
 */
export async function listSimplifiedEnrollments(req: Request, res: Response) {
  try {
    const { page = '1', limit = '10', search, status } = req.query;
    const pageNumber = parseInt(page as string);
    const pageSize = parseInt(limit as string);
    const offset = (pageNumber - 1) * pageSize;
    
    // Construir query com filtros
    let query = db.select({
      simplifiedEnrollments,
      // Obter os nomes das entidades relacionadas através dos joins
      courseInfo: courses,
      institutionInfo: institutions,
      poloInfo: polos,
    })
    .from(simplifiedEnrollments)
    .leftJoin(courses, eq(simplifiedEnrollments.courseId, courses.id))
    .leftJoin(institutions, eq(simplifiedEnrollments.institutionId, institutions.id))
    .leftJoin(polos, eq(simplifiedEnrollments.poloId, polos.id))
    .orderBy(desc(simplifiedEnrollments.createdAt));
    
    // Aplicar filtro de busca
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(simplifiedEnrollments.studentName, searchTerm),
          like(simplifiedEnrollments.studentCpf, searchTerm),
          like(simplifiedEnrollments.studentEmail, searchTerm),
          like(courses.name, searchTerm)
        )
      );
    }
    
    // Aplicar filtro de status
    if (status) {
      query = query.where(eq(simplifiedEnrollments.status, status as string));
    }
    
    // Consulta para contar o total usando SQL diretamente
    let whereClause = '';
    const params: any[] = [];
    
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause += `
        WHERE (
          "simplified_enrollments"."student_name" LIKE $${params.length + 1} OR
          "simplified_enrollments"."student_cpf" LIKE $${params.length + 1} OR
          "simplified_enrollments"."student_email" LIKE $${params.length + 1} OR
          "courses"."name" LIKE $${params.length + 1}
        )
      `;
      params.push(searchTerm);
    }
    
    if (status) {
      if (whereClause === '') {
        whereClause = 'WHERE ';
      } else {
        whereClause += ' AND ';
      }
      whereClause += `"simplified_enrollments"."status" = $${params.length + 1}`;
      params.push(status);
    }
    
    // Construir consulta SQL para contagem
    const countSql = `
      SELECT COUNT(*) as total 
      FROM "simplified_enrollments"
      LEFT JOIN "courses" ON "simplified_enrollments"."course_id" = "courses"."id"
      LEFT JOIN "institutions" ON "simplified_enrollments"."institution_id" = "institutions"."id"
      LEFT JOIN "polos" ON "simplified_enrollments"."polo_id" = "polos"."id"
      ${whereClause}
    `;
    
    // Executar consulta paginada
    const [enrollmentsResults, countResult] = await Promise.all([
      query.limit(pageSize).offset(offset),
      pool.query(countSql, params)
    ]);
    
    const totalItems = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Processar resultados para o formato adequado
    const formattedResults = enrollmentsResults.map(result => {
      // Pegar os valores do objeto de matrícula simplificada
      const enrollment = { 
        ...result.simplifiedEnrollments,
        // Adicionar os campos de join
        courseName: result.courseInfo?.name || 'Curso não encontrado',
        institutionName: result.institutionInfo?.name || 'Instituição não encontrada',
        poloName: result.poloInfo?.name || null
      };
      
      return enrollment;
    });
    
    res.json({
      success: true,
      data: formattedResults,
      page: pageNumber,
      limit: pageSize,
      pages: totalPages,
      total: totalItems
    });
  } catch (error) {
    console.error('[API] Erro ao listar matrículas simplificadas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar matrículas simplificadas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Busca uma matrícula simplificada pelo ID
 */
export async function getSimplifiedEnrollmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enrollmentId = parseInt(id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    const result = await db.select({
      simplifiedEnrollments,
      courseInfo: courses,
      institutionInfo: institutions,
      poloInfo: polos,
    })
    .from(simplifiedEnrollments)
    .leftJoin(courses, eq(simplifiedEnrollments.courseId, courses.id))
    .leftJoin(institutions, eq(simplifiedEnrollments.institutionId, institutions.id))
    .leftJoin(polos, eq(simplifiedEnrollments.poloId, polos.id))
    .where(eq(simplifiedEnrollments.id, enrollmentId))
    .limit(1);
    
    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }
    
    // Formatar resultado
    const enrollment = { 
      ...result[0].simplifiedEnrollments,
      courseName: result[0].courseInfo?.name || 'Curso não encontrado',
      institutionName: result[0].institutionInfo?.name || 'Instituição não encontrada',
      poloName: result[0].poloInfo?.name || null
    };
    
    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('[API] Erro ao buscar matrícula simplificada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar matrícula simplificada',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Cria uma nova matrícula simplificada
 */
export async function createSimplifiedEnrollment(req: Request, res: Response) {
  try {
    // Validar dados usando o schema
    try {
      insertSimplifiedEnrollmentSchema.parse(req.body);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const formattedError = fromZodError(validationError);
        return res.status(400).json({
          success: false,
          message: 'Dados de matrícula inválidos',
          error: formattedError.message
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Dados de matrícula inválidos',
        error: 'Erro de validação'
      });
    }
    
    const { 
      studentName, 
      studentEmail, 
      studentCpf, 
      studentPhone, 
      courseId, 
      institutionId,
      poloId, 
      amount,
      sourceChannel,
      externalReference,
      // Campos para cliente Asaas existente
      asaasCustomerId,
      // Novos campos para Asaas
      studentAddress,
      studentAddressNumber,
      studentAddressComplement,
      studentNeighborhood,
      studentCity,
      studentState,
      studentPostalCode,
      billingType,
      maxInstallmentCount,
      dueDateLimitDays,
      allowInstallments,
      interestRate,
      fine
    } = req.body;
    
    // Verificar se o curso existe
    const courseExists = await db.select({ id: courses.id, name: courses.name })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    
    if (!courseExists.length) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }
    
    // Verificar se a instituição existe
    const institutionExists = await db.select({ id: institutions.id, name: institutions.name })
      .from(institutions)
      .where(eq(institutions.id, institutionId))
      .limit(1);
    
    if (!institutionExists.length) {
      return res.status(404).json({
        success: false,
        message: 'Instituição não encontrada'
      });
    }
    
    // Verificar se o polo existe, se fornecido
    let poloName = null;
    if (poloId) {
      const poloExists = await db.select({ id: polos.id, name: polos.name })
        .from(polos)
        .where(eq(polos.id, poloId))
        .limit(1);
      
      if (!poloExists.length) {
        return res.status(404).json({
          success: false,
          message: 'Polo não encontrado'
        });
      }
      
      poloName = poloExists[0].name;
    }
    
    // Gerar um ID de referência externa único se não foi fornecido
    const generatedExternalReference = externalReference || `enroll-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Gerar UUID único para a matrícula
    const uuid = `enroll-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Definir data de expiração (30 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Obter o nome do curso e da instituição para incluir na matrícula
    const courseName = courseExists[0].name;
    const institutionName = institutionExists[0].name;
    
    // Criar a matrícula simplificada de acordo com o schema real do banco de dados
    const [newEnrollment] = await db.insert(simplifiedEnrollments).values({
      studentName,
      studentEmail,
      studentCpf,
      studentPhone: studentPhone || null,
      courseId,
      institutionId,
      poloId: poloId || null,
      amount,
      status: 'pending',
      sourceChannel: sourceChannel || 'admin-portal',
      externalReference: generatedExternalReference, // Usar o valor gerado ou o fornecido
      
      // Se tiver um ID de cliente Asaas, usar
      asaasCustomerId: asaasCustomerId || null,
      
      // Data de expiração - usando a data definida anteriormente
      expiresAt,
      
      // Metadados com dados adicionais
      metadata: JSON.stringify({
        billingType: billingType || 'UNDEFINED',
        maxInstallmentCount: maxInstallmentCount || 12,
        dueDateLimitDays: dueDateLimitDays || 30,
        allowInstallments: allowInstallments !== undefined ? allowInstallments : true,
        interestRate: interestRate || 0,
        fine: fine || 0,
        
        // Dados de endereço
        studentAddress,
        studentAddressNumber,
        studentAddressComplement,
        studentNeighborhood,
        studentCity,
        studentState,
        studentPostalCode
      }),
      
      // Dados para rastreamento das solicitações
      errorDetails: null,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 18 // ID do usuário admin no banco de dados, corresponde ao username 'admin'
    }).returning();
    
    // Adicionar os campos extras para a resposta
    const enrollmentWithDetails = {
      ...newEnrollment,
      courseName: courseExists[0].name,
      institutionName: institutionExists[0].name,
      poloName
    };
    
    res.status(201).json({
      success: true,
      message: 'Matrícula simplificada criada com sucesso',
      data: enrollmentWithDetails
    });
  } catch (error) {
    console.error('[API] Erro ao criar matrícula simplificada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar matrícula simplificada',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Gera um link de pagamento para uma matrícula
 */
export async function generatePaymentLink(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enrollmentId = parseInt(id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    // Buscar matrícula simplificada
    const enrollment = await db.select({
      simplifiedEnrollments,
      courseName: courses.name,
    })
    .from(simplifiedEnrollments)
    .leftJoin(courses, eq(simplifiedEnrollments.courseId, courses.id))
    .where(eq(simplifiedEnrollments.id, enrollmentId))
    .limit(1);
    
    if (!enrollment.length) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }
    
    const enrollmentData = enrollment[0].simplifiedEnrollments;
    
    // Verificar se já existe um link de pagamento
    if (enrollmentData.paymentLinkId && enrollmentData.paymentLinkUrl) {
      return res.json({
        success: true,
        message: 'Link de pagamento já existe',
        data: {
          paymentLinkId: enrollmentData.paymentLinkId,
          paymentLinkUrl: enrollmentData.paymentLinkUrl
        }
      });
    }
    
    // Criar cliente no Asaas, se necessário
    let asaasCustomerId = enrollmentData.asaasCustomerId;
    
    if (!asaasCustomerId) {
      try {
        // Verificar se já existe um cliente com esse CPF
        const existingCustomer = await AsaasDirectPaymentService.findCustomerByCpfCnpj(enrollmentData.studentCpf);
        
        if (existingCustomer) {
          asaasCustomerId = existingCustomer.id;
        } else {
          // Obter os detalhes armazenados para recuperar informações de endereço
          let metadataObj = {};
          try {
            if (enrollmentData.metadata) {
              metadataObj = JSON.parse(enrollmentData.metadata);
            } else if (enrollmentData.errorDetails) {
              // Compatibilidade com dados antigos
              metadataObj = JSON.parse(enrollmentData.errorDetails);
            }
          } catch (error) {
            console.error('[API] Erro ao converter metadados:', error);
          }
          
          // Garantir que o CPF esteja no formato correto (apenas números)
          const formattedCpf = enrollmentData.studentCpf.replace(/[^\d]+/g, '');
          console.log(`[API] CPF formatado para criar cliente: ${formattedCpf} (original: ${enrollmentData.studentCpf})`);
          
          // Validar se o CPF tem um tamanho válido
          if (formattedCpf.length !== 11) {
            console.error(`[API] CPF com tamanho inválido (${formattedCpf.length}): ${formattedCpf}`);
            return res.status(400).json({
              success: false,
              message: 'CPF inválido. O CPF deve ter 11 dígitos.',
              error: 'invalid_cpf_length'
            });
          }
          
          // Log dos dados que serão enviados ao Asaas
          console.log(`[API] Dados para criação do cliente:`, JSON.stringify({
            name: enrollmentData.studentName,
            email: enrollmentData.studentEmail,
            cpfCnpj: formattedCpf,
            mobilePhone: enrollmentData.studentPhone
          }, null, 2));
          
          // Criar novo cliente com dados completos incluindo endereço
          const customer = await AsaasDirectPaymentService.createCustomer({
            name: enrollmentData.studentName.trim(), // Garantir que não haja espaços extras
            email: enrollmentData.studentEmail,
            cpfCnpj: formattedCpf, // Usar o CPF formatado
            mobilePhone: enrollmentData.studentPhone ? enrollmentData.studentPhone.replace(/\D/g, '') : undefined,
            address: metadataObj.studentAddress,
            addressNumber: metadataObj.studentAddressNumber,
            complement: metadataObj.studentAddressComplement,
            province: metadataObj.studentNeighborhood,
            city: metadataObj.studentCity,
            state: metadataObj.studentState,
            postalCode: metadataObj.studentPostalCode ? metadataObj.studentPostalCode.replace(/\D/g, '') : undefined,
            personType: 'FISICA' // Especificar explicitamente o tipo de pessoa
          });
          
          asaasCustomerId = customer.id;
        }
        
        // Atualizar a matrícula com o ID do cliente
        await db.update(simplifiedEnrollments)
          .set({ asaasCustomerId, updatedAt: new Date() })
          .where(eq(simplifiedEnrollments.id, enrollmentId));
      } catch (error) {
        console.error('[API] Erro ao criar cliente no Asaas:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar cliente no Asaas',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    // Criar link de pagamento no Asaas
    try {
      const courseName = enrollment[0].courseName || 'Curso';
      const description = `Matrícula no curso: ${courseName}`;
      
      // Obter os detalhes armazenados para recuperar informações de pagamento
      let metadataObj = {};
      try {
        if (enrollmentData.metadata) {
          metadataObj = JSON.parse(enrollmentData.metadata);
        } else if (enrollmentData.errorDetails) {
          // Compatibilidade com dados antigos
          metadataObj = JSON.parse(enrollmentData.errorDetails);
        }
      } catch (error) {
        console.error('[API] Erro ao converter metadados:', error);
      }
      
      // Usar as configurações do formulário ou valores padrão
      const paymentLink = await AsaasDirectPaymentService.createPaymentLink({
        name: `Matrícula #${enrollmentId} - ${enrollmentData.studentName}`,
        description,
        value: enrollmentData.amount,
        billingType: metadataObj.billingType || 'UNDEFINED',
        chargeType: 'DETACHED',
        dueDateLimitDays: metadataObj.dueDateLimitDays || 30,
        maxInstallmentCount: metadataObj.maxInstallmentCount || 12,
        interestSettings: {
          value: metadataObj.interestRate || 0
        },
        fineSettings: {
          value: metadataObj.fine || 0
        }
      });
      
      // Atualizar a matrícula com os dados do link de pagamento
      await db.update(simplifiedEnrollments)
        .set({
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.url,
          status: 'waiting_payment',
          updatedAt: new Date()
        })
        .where(eq(simplifiedEnrollments.id, enrollmentId));
      
      res.json({
        success: true,
        message: 'Link de pagamento gerado com sucesso',
        data: {
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.url
        }
      });
    } catch (error) {
      console.error('[API] Erro ao gerar link de pagamento no Asaas:', error);
      
      // Armazenar detalhes do erro na matrícula
      await db.update(simplifiedEnrollments)
        .set({
          errorDetails: error instanceof Error ? error.message : JSON.stringify(error),
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(simplifiedEnrollments.id, enrollmentId));
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('[API] Erro ao gerar link de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar link de pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Atualiza o status de pagamento de uma matrícula
 */
export async function updatePaymentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enrollmentId = parseInt(id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    // Buscar matrícula simplificada
    const enrollment = await db.select()
      .from(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, enrollmentId))
      .limit(1);
    
    if (!enrollment.length) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }
    
    const enrollmentData = enrollment[0];
    
    // Verificar se há link de pagamento
    if (!enrollmentData.paymentLinkId) {
      return res.status(400).json({
        success: false,
        message: 'Esta matrícula não possui um link de pagamento gerado'
      });
    }
    
    // Verificar status do link de pagamento no Asaas
    try {
      const paymentLink = await AsaasDirectPaymentService.getPaymentLinkById(enrollmentData.paymentLinkId);
      
      if (!paymentLink) {
        return res.status(404).json({
          success: false,
          message: 'Link de pagamento não encontrado no Asaas'
        });
      }
      
      let newStatus = enrollmentData.status;
      
      // Mapear status do Asaas para status da aplicação
      if (paymentLink.active && paymentLink.totalPayments > 0) {
        newStatus = 'payment_confirmed';
        
        // Se tiver paymentId, buscar detalhes da cobrança
        if (paymentLink.lastPayment?.id) {
          // Atualizar com o ID do pagamento
          await db.update(simplifiedEnrollments)
            .set({
              paymentId: paymentLink.lastPayment.id,
              updatedAt: new Date()
            })
            .where(eq(simplifiedEnrollments.id, enrollmentId));
        }
      }
      
      // Atualizar status da matrícula
      await db.update(simplifiedEnrollments)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedById: 18 // ID do usuário admin no banco de dados, corresponde ao username 'admin'
        })
        .where(eq(simplifiedEnrollments.id, enrollmentId));
      
      res.json({
        success: true,
        message: 'Status de pagamento atualizado com sucesso',
        data: {
          status: newStatus,
          paymentDetails: paymentLink.active ? 
            { 
              totalPayments: paymentLink.totalPayments,
              lastPaymentId: paymentLink.lastPayment?.id 
            } : null
        }
      });
    } catch (error) {
      console.error('[API] Erro ao verificar status do link de pagamento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar status do link de pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('[API] Erro ao atualizar status de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status de pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Cancela uma matrícula
 */
export async function cancelEnrollment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enrollmentId = parseInt(id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    // Buscar matrícula simplificada
    const enrollment = await db.select()
      .from(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, enrollmentId))
      .limit(1);
    
    if (!enrollment.length) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }
    
    // Verificar se a matrícula já está cancelada
    if (enrollment[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Esta matrícula já está cancelada'
      });
    }
    
    // Cancelar o link de pagamento no Asaas, se existir
    if (enrollment[0].paymentLinkId) {
      try {
        await AsaasDirectPaymentService.deletePaymentLink(enrollment[0].paymentLinkId);
      } catch (error) {
        console.error('[API] Erro ao cancelar link de pagamento no Asaas:', error);
        // Não interromper o processo se falhar, apenas registrar o erro
      }
    }
    
    // Atualizar status da matrícula para cancelada
    await db.update(simplifiedEnrollments)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        updatedById: 18 // ID do usuário admin no banco de dados, corresponde ao username 'admin'
      })
      .where(eq(simplifiedEnrollments.id, enrollmentId));
    
    res.json({
      success: true,
      message: 'Matrícula cancelada com sucesso'
    });
  } catch (error) {
    console.error('[API] Erro ao cancelar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar matrícula',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}