/**
 * Controlador para operações CRM relacionadas ao Asaas
 */

import { Request, Response } from 'express';
import asaasCustomersService from '../services/asaas-customers-service';

/**
 * Cria um novo cliente no Asaas
 */
export async function createAsaasCustomer(req: Request, res: Response) {
  try {
    console.log('Criando novo cliente no Asaas:', req.body);
    
    // Validar os dados mínimos necessários
    const { name, email, cpfCnpj } = req.body;
    
    if (!name || !email || !cpfCnpj) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Nome, email e CPF/CNPJ são obrigatórios.'
      });
    }
    
    try {
      // Verificar se já existe um cliente com este CPF/CNPJ
      const existingCustomer = await asaasCustomersService.getCustomerByCpfCnpj(cpfCnpj);
      
      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um cliente cadastrado com este CPF/CNPJ',
          data: existingCustomer
        });
      }
      
      // Criar cliente no Asaas
      const newCustomer = await asaasCustomersService.createCustomer(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        data: newCustomer
      });
    } catch (apiError: any) {
      console.error('Erro na API do Asaas ao criar cliente:', apiError.message);
      
      res.status(500).json({
        success: false,
        message: 'Erro ao criar cliente no Asaas',
        error: apiError.message
      });
    }
  } catch (error: any) {
    console.error('Erro ao processar a criação de cliente:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a requisição',
      error: error.message
    });
  }
}

/**
 * Busca um cliente no Asaas pelo CPF/CNPJ
 */
export async function searchAsaasCustomerByCpfCnpj(req: Request, res: Response) {
  try {
    const { cpfCnpj } = req.query;
    
    if (!cpfCnpj || typeof cpfCnpj !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'CPF/CNPJ é obrigatório'
      });
    }
    
    // Formatar o CPF/CNPJ removendo caracteres não numéricos
    const formattedCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
    
    try {
      const customer = await asaasCustomersService.getCustomerByCpfCnpj(formattedCpfCnpj);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: customer
      });
    } catch (apiError: any) {
      console.error('Erro na API do Asaas ao buscar cliente:', apiError.message);
      
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar cliente no Asaas',
        error: apiError.message
      });
    }
  } catch (error: any) {
    console.error('Erro ao processar a busca de cliente:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a requisição',
      error: error.message
    });
  }
}