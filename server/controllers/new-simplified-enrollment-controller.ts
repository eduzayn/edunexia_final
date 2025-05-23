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
    
    // Criar perfil de estudante automaticamente com as informações da matrícula
    try {
      // Importar serviços necessários
      const storage = require('../storage').storage;
      const emailService = require('../services/email-service');
      const smsService = require('../services/sms-service');
      const contractsService = require('../services/contracts-service');
    
      // Verificar se já existe um usuário com esse email (verificando tanto username quanto email)
      let existingUser = await storage.getUserByUsername(studentEmail);
      
      // Se não encontrou pelo username, tentar pelo email (pode acontecer se o email e username forem diferentes)
      if (!existingUser) {
        try {
          existingUser = await storage.getUserByEmail(studentEmail);
          console.log(`[MATRÍCULA] Usuário encontrado pelo email, mas não pelo username: ${studentEmail}`);
        } catch (emailLookupError) {
          const errorMessage = emailLookupError instanceof Error ? emailLookupError.message : 'Erro desconhecido';
          console.log(`[MATRÍCULA] Erro ao buscar usuário pelo email: ${errorMessage}`);
        }
      }
      
      // Variável para armazenar o ID do usuário (novo ou existente)
      let userId;
      
      if (!existingUser) {
        console.log(`[MATRÍCULA] Criando perfil de estudante para: ${studentName}`);
        
        // Usar CPF como senha inicial (remover pontos e traços)
        const initialPassword = studentCpf ? 
          studentCpf.replace(/[^\d]/g, '') : // remover pontos e traços
          Math.random().toString(36).slice(-8); // senha aleatória se não tiver CPF
        
        // Formatar o CPF corretamente para persistência
        const formattedCpf = studentCpf ? studentCpf.replace(/[^\d]/g, '') : null;
        
        console.log(`[MATRÍCULA] Tentando criar usuário com email: ${studentEmail}, cpf: ${formattedCpf}`);
        
        // Criar o usuário no sistema com dados completos
        try {
          console.log(`[MATRÍCULA] Preparando dados para criar usuário:`);
          console.log(`- Username: ${studentEmail}`);
          console.log(`- Nome completo: ${studentName}`);
          console.log(`- Email: ${studentEmail}`);
          console.log(`- CPF formatado: ${formattedCpf}`);
          console.log(`- Telefone: ${studentPhone || 'Não informado'}`);
          console.log(`- Portal Type: student`);
          console.log(`- Status: active`);

          const userData = {
            username: studentEmail,
            password: initialPassword,
            fullName: studentName,
            email: studentEmail,
            cpf: formattedCpf,
            phone: studentPhone || null,
            portalType: 'student',
            status: 'active',
            asaasId: asaasCustomerId || null
          };

          const newUser = await storage.createUser(userData);
          
          if (newUser) {
            userId = newUser.id;
            console.log(`[MATRÍCULA] Perfil de estudante criado com sucesso! ID: ${userId}`);
            
            // Enviar email com as credenciais
            try {
              await emailService.sendStudentCredentialsEmail({
                to: newUser.email,
                name: newUser.fullName,
                username: newUser.username,
                password: initialPassword,
                courseName: courseName
              });
              console.log(`[MATRÍCULA] Email com credenciais enviado para: ${newUser.email}`);
            } catch (emailError) {
              console.error(`[MATRÍCULA] Erro ao enviar email com credenciais:`, emailError);
              console.error(`[MATRÍCULA] Detalhes do erro de email:`, emailError.message, emailError.stack);
            }
            
            // Enviar SMS com as credenciais
            try {
              if (newUser.phone) {
                await smsService.sendStudentCredentialsSMS(
                  newUser.phone,
                  initialPassword,
                  newUser.fullName,
                  newUser.email
                );
                console.log(`[MATRÍCULA] SMS com credenciais enviado para: ${newUser.phone}`);
              }
            } catch (smsError) {
              console.error(`[MATRÍCULA] Erro ao enviar SMS com credenciais:`, smsError);
              console.error(`[MATRÍCULA] Detalhes do erro de SMS:`, smsError.message, smsError.stack);
            }
          } else {
            console.error(`[MATRÍCULA] Falha ao criar usuário: retorno nulo do storage.createUser`);
          }
        } catch (createUserError) {
          console.error(`[MATRÍCULA] Erro ao criar usuário no sistema:`, createUserError);
          console.error(`[MATRÍCULA] Detalhes do erro:`, createUserError.message, createUserError.stack);
          
          // Tenta uma abordagem alternativa com menos campos
          try {
            console.log(`[MATRÍCULA] Tentando abordagem alternativa para criar usuário`);
            const simpleUser = await storage.createUser({
              username: studentEmail,
              password: initialPassword,
              fullName: studentName,
              email: studentEmail,
              portalType: 'student',
              status: 'active'
            });
            
            if (simpleUser) {
              userId = simpleUser.id;
              console.log(`[MATRÍCULA] Perfil simplificado criado com sucesso! ID: ${userId}`);
            }
          } catch (altError) {
            console.error(`[MATRÍCULA] Falha também na abordagem alternativa:`, altError);
          }
        }
      } else {
        userId = existingUser.id;
        console.log(`[MATRÍCULA] Estudante já possui perfil no sistema: ${userId} (${existingUser.username})`);
      }
      
      // Verificar se temos um ID de usuário válido (novo ou existente)
      if (userId) {
        // Atualizar a matrícula com a informação do usuário
        try {
          await db.update(simplifiedEnrollments)
            .set({ 
              // Campo adicionado ao schema e ao banco de dados
              studentId: userId, 
              updatedAt: new Date() 
            })
            .where(eq(simplifiedEnrollments.id, newEnrollment.id));
          
          console.log(`[MATRÍCULA] Matrícula #${newEnrollment.id} atualizada com studentId=${userId}`);
        } catch (updateError) {
          console.error('[MATRÍCULA] Erro ao atualizar matrícula com ID do estudante:', updateError);
        }
          
        console.log(`[MATRÍCULA] Matrícula simplificada #${newEnrollment.id} atualizada com studentId: ${userId}`);
          
        // Criar matrícula formal no sistema para associar o aluno ao curso
        try {
          console.log(`[MATRÍCULA] Criando matrícula formal para associar o aluno ao curso...`);
          
          // Gerar código único para a matrícula formal (formato: MAT + ano + número sequencial)
          const year = new Date().getFullYear().toString();
          const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const enrollmentCode = `MAT${year.substring(2)}${randomSuffix}`;
          
          // Criar a matrícula formal com os dados da matrícula simplificada
          const formalEnrollment = await storage.createEnrollment({
            code: enrollmentCode,
            studentId: userId,
            courseId: courseId,
            institutionId: institutionId,
            poloId: poloId || null,
            amount: parseFloat(amount.replace(',', '.')),
            paymentGateway: 'ASAAS',
            paymentExternalId: paymentLinkId || null,
            paymentUrl: paymentLinkUrl || null,
            paymentMethod: billingType || 'UNDEFINED',
            enrollmentDate: new Date(),
            status: 'pending_payment',
            observations: `Matrícula criada automaticamente a partir da matrícula simplificada #${newEnrollment.id}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          if (formalEnrollment) {
            console.log(`[MATRÍCULA] Matrícula formal criada com sucesso! ID: ${formalEnrollment.id}, Código: ${formalEnrollment.code}`);
            
            // Atualizar a matrícula simplificada com o ID da matrícula formal
            await db.update(simplifiedEnrollments)
              .set({ 
                enrollmentId: formalEnrollment.id,
                updatedAt: new Date() 
              })
              .where(eq(simplifiedEnrollments.id, newEnrollment.id));
            
            console.log(`[MATRÍCULA] Matrícula simplificada #${newEnrollment.id} atualizada com enrollmentId=${formalEnrollment.id}`);
          }
          
          // Gerar contrato educacional usando o serviço existente
          const contract = await contractsService.generateContract(newEnrollment.id);
          
          if (contract) {
            console.log(`[MATRÍCULA] Contrato gerado automaticamente! ID: ${contract.id}`);
          }
        } catch (enrollmentError) {
          console.error(`[MATRÍCULA] Erro ao criar matrícula formal:`, enrollmentError);
        }
      } else {
        console.error(`[MATRÍCULA] Não foi possível obter um ID de usuário válido para associar à matrícula #${newEnrollment.id}`);
      }
    } catch (profileError) {
      console.error(`[MATRÍCULA] Erro ao criar perfil de estudante:`, profileError);
      // Não interromper o fluxo se houver erro na criação do perfil
    }
    
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