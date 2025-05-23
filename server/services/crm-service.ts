/**
 * Serviço para o módulo CRM
 * Fornece funcionalidades para gerenciar clientes e contatos
 */

import { storage } from '../storage';
import { 
  Client, InsertClient,
  Contact, InsertContact 
} from '@shared/schema';
import { AsaasService } from './asaas-service';

// ==================== CLIENTES ====================

/**
 * Obtém todos os clientes com paginação e filtros
 */
export async function getClients(
  search?: string,
  status?: string,
  userId?: number,
  limit = 50,
  offset = 0
): Promise<Client[]> {
  try {
    return await storage.getClients(search, status, limit, offset);
  } catch (error) {
    console.error("Erro ao obter clientes:", error);
    throw new Error("Falha ao buscar clientes");
  }
}

/**
 * Obtém um cliente específico pelo ID com seus contatos
 */
export async function getClient(id: number): Promise<{client: Client | null, contacts: Contact[]}> {
  try {
    const client = await storage.getClient(id);
    
    // Se encontrou o cliente, buscar seus contatos
    const contacts = client ? await storage.getContactsByClient(id) : [];
    
    return { client: client || null, contacts };
  } catch (error) {
    console.error(`Erro ao obter cliente ${id}:`, error);
    throw new Error(`Falha ao buscar cliente ${id}`);
  }
}

/**
 * Busca cliente por CPF/CNPJ
 */
export async function getClientByDocument(document: string): Promise<Client | null> {
  try {
    const client = await storage.getClientByDocument(document);
    return client || null;
  } catch (error) {
    console.error(`Erro ao buscar cliente por documento ${document}:`, error);
    throw new Error(`Falha ao buscar cliente por documento ${document}`);
  }
}

/**
 * Cria um novo cliente
 */
export async function createClient(data: InsertClient): Promise<Client> {
  try {
    // Verificar se já existe cliente com o mesmo documento
    if (data.document) {
      const existingClient = await storage.getClientByDocument(data.document);
      if (existingClient) {
        throw new Error(`Já existe um cliente com o documento ${data.document}`);
      }
    }
    
    // Criar o cliente no banco de dados
    const newClient = await storage.createClient(data);
    
    // Tentar cadastrar o cliente no Asaas
    try {
      // Verificar se o cliente tem um documento válido para o Asaas
      if (!newClient.document) {
        console.log(`Cliente ${newClient.id} não tem CPF/CNPJ para cadastro no Asaas`);
      } else {
        // Passar o cliente diretamente para o serviço Asaas
        // que usará a função mapClientToAsaasCustomer para fazer o mapeamento correto
        const asaasData = newClient;
        
        // Adicionar campos opcionais de endereço se disponíveis na implementação futura
        // quando esses campos forem adicionados ao schema de clientes
        
        // Cadastrar no Asaas
        const asaasResponse = await AsaasService.createCustomer(asaasData, newClient.id);
        
        // Se o cadastro no Asaas for bem-sucedido, atualizar o ID do Asaas no cliente
        if (asaasResponse && asaasResponse.id) {
          // Atualizar o cliente com o ID do Asaas
          await storage.updateClient(newClient.id, {
            asaasId: asaasResponse.id
          });
          
          // Atualizar o objeto do cliente que será retornado
          newClient.asaasId = asaasResponse.id;
        }
      }
    } catch (asaasError) {
      // Apenas logar o erro sem interromper o fluxo
      console.error(`Erro ao cadastrar cliente ${newClient.id} no Asaas:`, asaasError);
      // O cliente foi criado no banco mas não foi cadastrado no Asaas
      // Isso pode ser tratado posteriormente com uma rotina de sincronização
    }
    
    return newClient;
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    throw new Error("Falha ao criar cliente: " + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
  try {
    // Verificar se o cliente existe
    const existingClient = await storage.getClient(id);
    if (!existingClient) {
      throw new Error(`Cliente ${id} não encontrado`);
    }
    
    // Verificar se está tentando atualizar o documento para um que já existe
    if (data.document && data.document !== existingClient.document) {
      const clientWithSameDocument = await storage.getClientByDocument(data.document);
      if (clientWithSameDocument && clientWithSameDocument.id !== id) {
        throw new Error(`Já existe outro cliente com o documento ${data.document}`);
      }
    }
    
    // Atualizar o cliente no banco de dados
    const updatedClient = await storage.updateClient(id, data);
    if (!updatedClient) {
      throw new Error(`Falha ao atualizar cliente ${id}`);
    }
    
    // Tentar atualizar o cliente no Asaas se necessário
    try {
      // Se o cliente tem um asaasId, atualizar no Asaas
      if (updatedClient.asaasId) {
        // Criar objeto para o Asaas com os dados disponíveis
        const asaasData: any = {
          name: updatedClient.name,
          email: updatedClient.email,
          phone: updatedClient.phone,
          postalCode: updatedClient.zipCode,
          address: updatedClient.address
        };
        
        // Se o documento foi alterado, incluir no update
        if (data.document) {
          asaasData.cpfCnpj = updatedClient.document;
        }
        
        // Atualizar no Asaas
        await AsaasService.updateCustomer(updatedClient.asaasId, asaasData);
      } 
      // Se o cliente não tem asaasId mas tem um documento, criar no Asaas
      else if (updatedClient.document && !data.asaasId) {
        // Passar o cliente diretamente para o serviço Asaas
        // que usará a função mapClientToAsaasCustomer para fazer o mapeamento correto
        const asaasData = updatedClient;
        
        // Criar no Asaas
        const asaasResponse = await AsaasService.createCustomer(asaasData, updatedClient.id);
        
        // Se o cadastro no Asaas for bem-sucedido, atualizar o ID do Asaas no cliente
        if (asaasResponse && asaasResponse.id) {
          await storage.updateClient(updatedClient.id, {
            asaasId: asaasResponse.id
          });
          
          // Atualizar o objeto do cliente que será retornado
          updatedClient.asaasId = asaasResponse.id;
        }
      }
    } catch (asaasError) {
      // Apenas logar o erro sem interromper o fluxo
      console.error(`Erro ao atualizar cliente ${id} no Asaas:`, asaasError);
    }
    
    return updatedClient;
  } catch (error) {
    console.error(`Erro ao atualizar cliente ${id}:`, error);
    throw new Error(`Falha ao atualizar cliente ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Exclui um cliente
 */
export async function deleteClient(id: number): Promise<boolean> {
  try {
    // Buscar o cliente para verificar se tem asaasId
    const client = await storage.getClient(id);
    if (client && client.asaasId) {
      // Tentar inativar o cliente no Asaas antes de excluí-lo do banco
      try {
        await AsaasService.deleteCustomer(client.asaasId);
      } catch (asaasError) {
        // Apenas logar o erro sem interromper o fluxo
        console.error(`Erro ao inativar cliente ${id} no Asaas:`, asaasError);
      }
    }
    
    // Excluir o cliente no banco de dados
    return await storage.deleteClient(id);
  } catch (error) {
    console.error(`Erro ao excluir cliente ${id}:`, error);
    throw new Error(`Falha ao excluir cliente ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

// ==================== CONTATOS ====================

/**
 * Obtém um contato específico pelo ID
 */
export async function getContact(id: number): Promise<Contact | null> {
  try {
    const contact = await storage.getContact(id);
    return contact || null;
  } catch (error) {
    console.error(`Erro ao obter contato ${id}:`, error);
    throw new Error(`Falha ao buscar contato ${id}`);
  }
}

/**
 * Obtém todos os contatos de um cliente
 */
export async function getContactsByClient(clientId: number): Promise<Contact[]> {
  try {
    return await storage.getContactsByClient(clientId);
  } catch (error) {
    console.error(`Erro ao obter contatos do cliente ${clientId}:`, error);
    throw new Error(`Falha ao buscar contatos do cliente ${clientId}`);
  }
}

/**
 * Cria um novo contato
 */
export async function createContact(data: InsertContact): Promise<Contact> {
  try {
    // Verificar se o cliente existe
    const client = await storage.getClient(data.clientId);
    if (!client) {
      throw new Error(`Cliente ${data.clientId} não encontrado`);
    }
    
    return await storage.createContact(data);
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    throw new Error("Falha ao criar contato: " + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Atualiza um contato existente
 */
export async function updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
  try {
    // Verificar se o contato existe
    const existingContact = await storage.getContact(id);
    if (!existingContact) {
      throw new Error(`Contato ${id} não encontrado`);
    }
    
    // Se está alterando o cliente, verificar se o novo cliente existe
    if (data.clientId && data.clientId !== existingContact.clientId) {
      const newClient = await storage.getClient(data.clientId);
      if (!newClient) {
        throw new Error(`Cliente ${data.clientId} não encontrado`);
      }
    }
    
    const updatedContact = await storage.updateContact(id, data);
    if (!updatedContact) {
      throw new Error(`Falha ao atualizar contato ${id}`);
    }
    
    return updatedContact;
  } catch (error) {
    console.error(`Erro ao atualizar contato ${id}:`, error);
    throw new Error(`Falha ao atualizar contato ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Exclui um contato
 */
export async function deleteContact(id: number): Promise<boolean> {
  try {
    return await storage.deleteContact(id);
  } catch (error) {
    console.error(`Erro ao excluir contato ${id}:`, error);
    throw new Error(`Falha ao excluir contato ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}