/**
 * Controlador para operações de CRM, incluindo clientes e contatos
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { clients } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { AsaasDirectPaymentService } from '../services/asaas-direct-payment-service';

/**
 * Cria um novo cliente no Asaas e no sistema local
 */
export async function createAsaasCustomer(req: Request, res: Response) {
  try {
    const { name, email, cpfCnpj, phone, mobilePhone, address, addressNumber, complement, province, postalCode } = req.body;

    // Validação básica
    if (!name || !email || !cpfCnpj) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Nome, email e CPF/CNPJ são obrigatórios.'
      });
    }

    // Verificar se o cliente já existe no sistema local
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.document, cpfCnpj))
      .limit(1);

    if (existingClient.length) {
      return res.status(409).json({
        success: false,
        message: 'Cliente com este CPF/CNPJ já existe no sistema.',
        data: existingClient[0]
      });
    }

    // Verificar se o cliente já existe no Asaas
    try {
      const existingAsaasCustomer = await AsaasDirectPaymentService.findCustomerByCpfCnpj(cpfCnpj);
      
      if (existingAsaasCustomer) {
        // Cliente já existe no Asaas, mas não no sistema local
        // Criar no sistema local com o ID do Asaas
        const newClient = await db.insert(clients).values({
          name,
          email,
          document: cpfCnpj,
          phone: phone || mobilePhone,
          address: address ? `${address}, ${addressNumber || 'S/N'}${complement ? `, ${complement}` : ''}` : null,
          city: province || null,
          zipCode: postalCode || null,
          type: cpfCnpj.length > 11 ? 'pj' : 'pf',
          status: 'active',
          asaasId: existingAsaasCustomer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: req.user?.id || null
        }).returning();

        return res.status(200).json({
          success: true,
          message: 'Cliente já existia no Asaas e foi sincronizado com o sistema local.',
          data: {
            client: newClient[0],
            asaasCustomer: existingAsaasCustomer
          }
        });
      }
    } catch (error) {
      // Ignorar erro de cliente não encontrado e seguir com a criação
      console.log('Cliente não encontrado no Asaas, prosseguindo com criação:', error);
    }

    // Criar o cliente no Asaas
    const asaasCustomer = await AsaasDirectPaymentService.createCustomer({
      name,
      email,
      cpfCnpj,
      phone,
      mobilePhone,
      address,
      addressNumber,
      complement,
      province,
      postalCode
    });

    // Criar o cliente no sistema local
    const newClient = await db.insert(clients).values({
      name,
      email,
      document: cpfCnpj,
      phone: phone || mobilePhone,
      address: address ? `${address}, ${addressNumber || 'S/N'}${complement ? `, ${complement}` : ''}` : null,
      city: province || null,
      zipCode: postalCode || null,
      type: cpfCnpj.length > 11 ? 'pj' : 'pf',
      status: 'active',
      asaasId: asaasCustomer.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: req.user?.id || null
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso no Asaas e no sistema local.',
      data: {
        client: newClient[0],
        asaasCustomer
      }
    });
  } catch (error) {
    console.error('[CRM] Erro ao criar cliente Asaas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar cliente no Asaas.',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Busca um cliente pelo CPF/CNPJ no Asaas
 */
export async function searchAsaasCustomerByCpfCnpj(req: Request, res: Response) {
  try {
    const { cpfCnpj } = req.query;

    if (!cpfCnpj) {
      return res.status(400).json({
        success: false,
        message: 'CPF/CNPJ não informado'
      });
    }

    const customer = await AsaasDirectPaymentService.findCustomerByCpfCnpj(cpfCnpj as string);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado no Asaas'
      });
    }

    // Verificar se o cliente existe no sistema local
    const localClient = await db
      .select()
      .from(clients)
      .where(eq(clients.document, cpfCnpj as string))
      .limit(1);

    res.status(200).json({
      success: true,
      data: {
        asaasCustomer: customer,
        localClient: localClient.length ? localClient[0] : null
      }
    });
  } catch (error) {
    console.error('[CRM] Erro ao buscar cliente por CPF/CNPJ:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cliente no Asaas.',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}