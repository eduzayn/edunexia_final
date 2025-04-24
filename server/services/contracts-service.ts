import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { storage } from '../storage';
import {
  EducationalContract,
  educationalContracts
} from '@shared/schema';
import PDFDocument from 'pdfkit';

/**
 * Gera um contrato educacional com base nos dados da matrícula
 * @param enrollmentId ID da matrícula simplificada
 */
export async function generateContract(enrollmentId: number): Promise<EducationalContract> {
  try {
    // Buscar a matrícula pelo ID
    const enrollment = await storage.getSimplifiedEnrollmentById(enrollmentId);
    
    if (!enrollment) {
      throw new Error(`Matrícula não encontrada com ID: ${enrollmentId}`);
    }
    
    // Verificar se já existe um contrato para esta matrícula
    const existingContracts = await storage.getContracts({
      enrollmentId: enrollmentId
    });
    
    if (existingContracts && existingContracts.length > 0) {
      // Retornar o contrato existente se já houver um
      console.log(`Contrato já existe para a matrícula ${enrollmentId}, retornando o contrato existente.`);
      return existingContracts[0];
    }
    
    // Buscar informações do curso
    const course = enrollment.courseId 
      ? await storage.getCourseById(enrollment.courseId)
      : null;
    
    if (!course) {
      throw new Error(`Curso não encontrado para a matrícula ID: ${enrollmentId}`);
    }
    
    // Buscar informações do aluno
    const student = enrollment.studentId
      ? await storage.getUserById(enrollment.studentId)
      : null;
    
    if (!student) {
      throw new Error(`Aluno não encontrado para a matrícula ID: ${enrollmentId}`);
    }
    
    // Determinar o tipo de contrato com base no tipo de curso
    let contractType = 'default';
    
    if (course.courseTypeId) {
      const courseType = await storage.getCourseTypeById(course.courseTypeId);
      if (courseType) {
        switch(courseType.code) {
          case 'POS': 
            contractType = 'pos-graduacao';
            break;
          case 'MBA':
            contractType = 'mba';
            break;
          case 'GRADUACAO':
          case 'SEG_LICENCIATURA':
            contractType = 'graduacao';
            break;
          default:
            contractType = 'default';
        }
      }
    }
    
    // Criar dados do contrato com base nas informações da matrícula
    const contractData = {
      enrollmentId: enrollment.id,
      studentId: student.id,
      courseId: course.id,
      contractType: contractType,
      contractNumber: `${new Date().getFullYear()}-${enrollment.id}`,
      status: 'pending' as const,
      totalValue: enrollment.totalValue || course.price || 0,
      installments: enrollment.installments || 1,
      installmentValue: enrollment.installmentValue || (enrollment.totalValue ? enrollment.totalValue / (enrollment.installments || 1) : 0),
      paymentMethod: enrollment.paymentMethod || 'credit_card',
      discount: enrollment.discount || 0,
      createdAt: new Date(),
      signatureDate: null,
      signatureData: null,
      additionalTerms: null,
      startDate: course.startDate || new Date(),
      endDate: course.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      campus: enrollment.campus || 'Online'
    };
    
    // Criar o contrato no banco de dados
    const contract = await storage.createContract(contractData);
    
    return contract;
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    throw error;
  }
}

/**
 * Obtém um contrato pelo ID
 * @param contractId ID do contrato
 */
export async function getContractById(contractId: number): Promise<EducationalContract | null> {
  try {
    const contract = await storage.getContract(contractId);
    return contract;
  } catch (error) {
    console.error(`Erro ao buscar contrato com ID ${contractId}:`, error);
    throw error;
  }
}

/**
 * Obtém todos os contratos de um estudante
 * @param studentId ID do estudante
 */
export async function getContractsByStudentId(studentId: number): Promise<EducationalContract[]> {
  try {
    const contracts = await storage.getContracts({
      studentId: studentId
    });
    
    return contracts;
  } catch (error) {
    console.error(`Erro ao buscar contratos do estudante ${studentId}:`, error);
    throw error;
  }
}

/**
 * Obtém todos os contratos de uma matrícula
 * @param enrollmentId ID da matrícula
 */
export async function getContractsByEnrollmentId(enrollmentId: number): Promise<EducationalContract[]> {
  try {
    const contracts = await storage.getContracts({
      enrollmentId: enrollmentId
    });
    
    return contracts;
  } catch (error) {
    console.error(`Erro ao buscar contratos da matrícula ${enrollmentId}:`, error);
    throw error;
  }
}

/**
 * Assina um contrato
 * @param contractId ID do contrato
 * @param signatureData Dados da assinatura (imagem em base64 ou string)
 */
export async function signContract(
  contractId: number, 
  signatureData: string
): Promise<EducationalContract | null> {
  try {
    const contract = await storage.getContract(contractId);
    
    if (!contract) {
      throw new Error(`Contrato não encontrado com ID: ${contractId}`);
    }
    
    // Atualizar o contrato com os dados da assinatura
    const updatedContract = await storage.updateContract(contractId, {
      status: 'signed',
      signatureDate: new Date(),
      signatureData: signatureData
    });
    
    return updatedContract;
  } catch (error) {
    console.error(`Erro ao assinar contrato ${contractId}:`, error);
    throw error;
  }
}

/**
 * Gera um PDF do contrato
 * @param contractId ID do contrato
 */
export async function downloadContract(contractId: number): Promise<Buffer> {
  try {
    // Buscar o contrato
    const contract = await storage.getContract(contractId);
    
    if (!contract) {
      throw new Error(`Contrato não encontrado com ID: ${contractId}`);
    }
    
    // Buscar informações relacionadas ao contrato
    const student = await storage.getUserById(contract.studentId);
    const course = await storage.getCourseById(contract.courseId);
    
    if (!student || !course) {
      throw new Error('Informações do contrato incompletas');
    }
    
    // Criar um novo documento PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Buffer para armazenar o PDF
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Adicionar cabeçalho
    doc.fontSize(18).text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Contrato Nº: ${contract.contractNumber}`, { align: 'center' });
    doc.moveDown(2);
    
    // Adicionar informações do contrato
    doc.fontSize(12).text('CONTRATANTE:', { bold: true });
    doc.fontSize(10).text(`Nome: ${student.fullName}`);
    doc.text(`CPF: ${student.cpf || 'Não informado'}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Telefone: ${student.phone || 'Não informado'}`);
    doc.text(`Endereço: ${student.address || 'Não informado'}`);
    doc.moveDown();
    
    doc.fontSize(12).text('CONTRATADA:', { bold: true });
    doc.fontSize(10).text('Nome: EdunexIA - Educação e Tecnologia LTDA');
    doc.text('CNPJ: XX.XXX.XXX/0001-XX');
    doc.text('Endereço: Av. XXXX, nº XXX, Bairro, Cidade - UF');
    doc.moveDown();
    
    doc.fontSize(12).text('CURSO:', { bold: true });
    doc.fontSize(10).text(`Nome: ${course.name}`);
    doc.text(`Código: ${course.code}`);
    doc.text(`Carga Horária: ${course.workload} horas`);
    doc.text(`Campus: ${contract.campus}`);
    doc.text(`Data de Início: ${contract.startDate.toLocaleDateString('pt-BR')}`);
    doc.text(`Data de Término: ${contract.endDate.toLocaleDateString('pt-BR')}`);
    doc.moveDown();
    
    doc.fontSize(12).text('INVESTIMENTO:', { bold: true });
    doc.fontSize(10).text(`Valor Total: R$ ${contract.totalValue.toFixed(2)}`);
    doc.text(`Número de Parcelas: ${contract.installments}`);
    doc.text(`Valor da Parcela: R$ ${contract.installmentValue.toFixed(2)}`);
    doc.text(`Forma de Pagamento: ${formatPaymentMethod(contract.paymentMethod)}`);
    
    if (contract.discount > 0) {
      doc.text(`Desconto: R$ ${contract.discount.toFixed(2)}`);
    }
    doc.moveDown(2);
    
    // Texto do contrato baseado no tipo
    doc.fontSize(12).text('TERMOS E CONDIÇÕES', { bold: true, align: 'center' });
    doc.moveDown();
    
    // Texto do contrato com base no tipo
    const terms = getContractTextByType(contract.contractType);
    doc.fontSize(10).text(terms, { align: 'justify' });
    doc.moveDown(2);
    
    // Termos adicionais, se houver
    if (contract.additionalTerms) {
      doc.fontSize(12).text('TERMOS ADICIONAIS', { bold: true });
      doc.fontSize(10).text(contract.additionalTerms, { align: 'justify' });
      doc.moveDown(2);
    }
    
    // Local de assinatura
    doc.fontSize(10).text(`${contract.campus}, ${new Date().toLocaleDateString('pt-BR')}`);
    doc.moveDown(2);
    
    // Espaço para assinaturas
    doc.fontSize(10).text('_____________________________', { align: 'center' });
    doc.text('Assinatura do Contratante', { align: 'center' });
    doc.moveDown();
    
    // Se o contrato já foi assinado, adicionar a assinatura
    if (contract.status === 'signed' && contract.signatureData) {
      try {
        // Se a assinatura for uma imagem em base64
        if (contract.signatureData.startsWith('data:image')) {
          // Extrair os dados da imagem base64
          const base64Data = contract.signatureData.split(',')[1];
          // Converter base64 para buffer
          const signatureBuffer = Buffer.from(base64Data, 'base64');
          // Adicionar a imagem ao PDF (ajustar conforme necessário)
          doc.image(signatureBuffer, { fit: [200, 100], align: 'center' });
        } else {
          // Se for apenas texto, adicionar como texto
          doc.fontSize(10).text(`Assinado eletronicamente por: ${student.fullName}`, { align: 'center' });
          doc.text(`Data: ${contract.signatureDate?.toLocaleDateString('pt-BR')}`, { align: 'center' });
        }
      } catch (err) {
        console.error('Erro ao processar assinatura:', err);
        // Em caso de erro, apenas adicionar texto de assinatura
        doc.fontSize(10).text('(Assinado eletronicamente)', { align: 'center' });
      }
    }
    
    doc.moveDown(2);
    doc.fontSize(10).text('_____________________________', { align: 'center' });
    doc.text('Assinatura da Contratada', { align: 'center' });
    
    // Finalizar o documento
    doc.end();
    
    // Retornar o buffer do PDF
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      
      doc.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Erro ao gerar PDF do contrato ${contractId}:`, error);
    throw error;
  }
}

/**
 * Formata o método de pagamento para exibição
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'bank_slip': 'Boleto Bancário',
    'bank_transfer': 'Transferência Bancária',
    'pix': 'PIX',
    'cash': 'Dinheiro',
    'other': 'Outro'
  };
  
  return methods[method] || method;
}

/**
 * Retorna o texto do contrato com base no tipo
 */
function getContractTextByType(contractType: string): string {
  switch (contractType) {
    case 'pos-graduacao':
      return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE PÓS-GRADUAÇÃO LATO SENSU

Pelo presente instrumento particular de Contrato de Prestação de Serviços Educacionais, de um lado, o CONTRATANTE, devidamente qualificado no anverso, e, de outro lado, a CONTRATADA, instituição de ensino superior, também qualificada no anverso, representada na forma de seus atos constitutivos, têm entre si, justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O objeto do presente contrato é a prestação de serviços educacionais pela CONTRATADA ao CONTRATANTE, para o curso de pós-graduação lato sensu acima especificado, conforme Projeto Pedagógico do Curso.

CLÁUSULA 2ª - DA MATRÍCULA
A matrícula do CONTRATANTE será efetivada mediante o preenchimento e assinatura do presente contrato, bem como do pagamento da primeira parcela do curso.

CLÁUSULA 3ª - DO REGIME DIDÁTICO
O CONTRATANTE declara estar ciente do regime didático adotado pela CONTRATADA, bem como das normas e procedimentos internos, comprometendo-se a respeitá-los integralmente.

CLÁUSULA 4ª - DO PREÇO E FORMA DE PAGAMENTO
O valor total do curso é o indicado no anverso, podendo ser pago à vista ou de forma parcelada, conforme opção do CONTRATANTE.

CLÁUSULA 5ª - DA INTERRUPÇÃO DOS SERVIÇOS
O CONTRATANTE poderá resilir o presente contrato, desde que notifique previamente a CONTRATADA e quite todas as parcelas vencidas até a data da resilição, além de multa compensatória correspondente a 20% das parcelas vincendas.

CLÁUSULA 6ª - DO CERTIFICADO
O certificado de conclusão de curso será expedido somente após o CONTRATANTE cumprir todas as exigências acadêmicas e financeiras estabelecidas pela CONTRATADA.

CLÁUSULA 7ª - DO FORO
As partes elegem o foro da Comarca da sede da CONTRATADA para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.
      `;
      
    case 'mba':
      return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE MBA PÓS-GRADUAÇÃO LATO SENSU

Pelo presente instrumento particular de Contrato de Prestação de Serviços Educacionais, de um lado, o CONTRATANTE, devidamente qualificado no anverso, e, de outro lado, a CONTRATADA, instituição de ensino superior, também qualificada no anverso, representada na forma de seus atos constitutivos, têm entre si, justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O objeto do presente contrato é a prestação de serviços educacionais pela CONTRATADA ao CONTRATANTE, para o curso de MBA pós-graduação lato sensu acima especificado, conforme Projeto Pedagógico do Curso.

CLÁUSULA 2ª - DA MATRÍCULA
A matrícula do CONTRATANTE será efetivada mediante o preenchimento e assinatura do presente contrato, bem como do pagamento da primeira parcela do curso.

CLÁUSULA 3ª - DO REGIME DIDÁTICO
O CONTRATANTE declara estar ciente do regime didático adotado pela CONTRATADA, bem como das normas e procedimentos internos, comprometendo-se a respeitá-los integralmente.

CLÁUSULA 4ª - DO PREÇO E FORMA DE PAGAMENTO
O valor total do curso é o indicado no anverso, podendo ser pago à vista ou de forma parcelada, conforme opção do CONTRATANTE.

CLÁUSULA 5ª - DA INTERRUPÇÃO DOS SERVIÇOS
O CONTRATANTE poderá resilir o presente contrato, desde que notifique previamente a CONTRATADA e quite todas as parcelas vencidas até a data da resilição, além de multa compensatória correspondente a 20% das parcelas vincendas.

CLÁUSULA 6ª - DO CERTIFICADO
O certificado de conclusão de curso será expedido somente após o CONTRATANTE cumprir todas as exigências acadêmicas e financeiras estabelecidas pela CONTRATADA.

CLÁUSULA 7ª - DO FORO
As partes elegem o foro da Comarca da sede da CONTRATADA para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.
      `;
      
    case 'graduacao':
      return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE GRADUAÇÃO

Pelo presente instrumento particular de Contrato de Prestação de Serviços Educacionais, de um lado, o CONTRATANTE, devidamente qualificado no anverso, e, de outro lado, a CONTRATADA, instituição de ensino superior, também qualificada no anverso, representada na forma de seus atos constitutivos, têm entre si, justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O objeto do presente contrato é a prestação de serviços educacionais pela CONTRATADA ao CONTRATANTE, para o curso de graduação acima especificado, conforme Projeto Pedagógico do Curso aprovado pelo MEC.

CLÁUSULA 2ª - DA MATRÍCULA
A matrícula do CONTRATANTE será efetivada mediante o preenchimento e assinatura do presente contrato, bem como do pagamento da primeira parcela do curso.

CLÁUSULA 3ª - DO REGIME DIDÁTICO
O CONTRATANTE declara estar ciente do regime didático adotado pela CONTRATADA, bem como das normas e procedimentos internos, comprometendo-se a respeitá-los integralmente.

CLÁUSULA 4ª - DO PREÇO E FORMA DE PAGAMENTO
O valor total do curso é o indicado no anverso, podendo ser pago à vista ou de forma parcelada, conforme opção do CONTRATANTE.

CLÁUSULA 5ª - DA INTERRUPÇÃO DOS SERVIÇOS
O CONTRATANTE poderá resilir o presente contrato, desde que notifique previamente a CONTRATADA e quite todas as parcelas vencidas até a data da resilição, além de multa compensatória correspondente a 20% das parcelas vincendas.

CLÁUSULA 6ª - DO DIPLOMA
O diploma de conclusão de curso será expedido somente após o CONTRATANTE cumprir todas as exigências acadêmicas e financeiras estabelecidas pela CONTRATADA e pelo MEC.

CLÁUSULA 7ª - DO FORO
As partes elegem o foro da Comarca da sede da CONTRATADA para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.
      `;
      
    default:
      return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

Pelo presente instrumento particular de Contrato de Prestação de Serviços Educacionais, de um lado, o CONTRATANTE, devidamente qualificado no anverso, e, de outro lado, a CONTRATADA, instituição de ensino, também qualificada no anverso, representada na forma de seus atos constitutivos, têm entre si, justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O objeto do presente contrato é a prestação de serviços educacionais pela CONTRATADA ao CONTRATANTE, para o curso acima especificado, conforme Projeto Pedagógico do Curso.

CLÁUSULA 2ª - DA MATRÍCULA
A matrícula do CONTRATANTE será efetivada mediante o preenchimento e assinatura do presente contrato, bem como do pagamento da primeira parcela do curso.

CLÁUSULA 3ª - DO REGIME DIDÁTICO
O CONTRATANTE declara estar ciente do regime didático adotado pela CONTRATADA, bem como das normas e procedimentos internos, comprometendo-se a respeitá-los integralmente.

CLÁUSULA 4ª - DO PREÇO E FORMA DE PAGAMENTO
O valor total do curso é o indicado no anverso, podendo ser pago à vista ou de forma parcelada, conforme opção do CONTRATANTE.

CLÁUSULA 5ª - DA INTERRUPÇÃO DOS SERVIÇOS
O CONTRATANTE poderá resilir o presente contrato, desde que notifique previamente a CONTRATADA e quite todas as parcelas vencidas até a data da resilição, além de multa compensatória correspondente a 20% das parcelas vincendas.

CLÁUSULA 6ª - DO CERTIFICADO
O certificado de conclusão de curso será expedido somente após o CONTRATANTE cumprir todas as exigências acadêmicas e financeiras estabelecidas pela CONTRATADA.

CLÁUSULA 7ª - DO FORO
As partes elegem o foro da Comarca da sede da CONTRATADA para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.
      `;
  }
}