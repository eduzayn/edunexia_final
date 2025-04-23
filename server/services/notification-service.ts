/**
 * Serviço de Notificações
 * 
 * Este serviço gerencia o envio de notificações para parceiros sobre mudanças
 * de status nas solicitações de certificação.
 */

import { db } from '../db';
import { users, notifications } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Tipos de notificações suportados
export type NotificationType = 
  | 'certification_status_change'  // Alteração de status de certificação
  | 'certificate_generated'        // Certificado gerado com sucesso
  | 'payment_received'             // Pagamento recebido
  | 'payment_overdue'              // Pagamento em atraso
  | 'document_rejected'            // Documento rejeitado (requer ação)
  | 'system_message';              // Mensagem do sistema

// Interface para dados da notificação
export interface NotificationData {
  requestId?: number;
  requestCode?: string;
  oldStatus?: string;
  newStatus?: string;
  certificateId?: number;
  documentId?: number;
  rejectionReason?: string;
  paymentId?: string;
  message?: string;
  actionUrl?: string;
}

/**
 * Envia uma notificação para um usuário do sistema
 */
export async function sendNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  data: NotificationData = {}
): Promise<boolean> {
  try {
    // Verificar se o usuário existe
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      console.error(`[NOTIFICATION] Usuário com ID ${userId} não encontrado`);
      return false;
    }
    
    // Criar a notificação no banco de dados
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      data: data as any, // Armazenar dados adicionais como JSON
      isRead: false,
      createdAt: new Date()
    });
    
    // Implementar envio por outros canais (e-mail, push notification, etc.)
    // conforme necessário no futuro
    
    console.log(`[NOTIFICATION] Notificação enviada para usuário ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Envia notificação de mudança de status de certificação
 */
export async function sendCertificationStatusChangeNotification(
  partnerId: number,
  requestId: number,
  requestCode: string,
  oldStatus: string,
  newStatus: string
): Promise<boolean> {
  // Definir título e mensagem com base na mudança de status
  let title = 'Status da Certificação Atualizado';
  let message = `A solicitação de certificação ${requestCode} teve seu status alterado de ${translateStatus(oldStatus)} para ${translateStatus(newStatus)}.`;
  
  // Personalizar a mensagem com base no novo status
  switch (newStatus) {
    case 'approved':
      title = 'Certificação Aprovada';
      message = `Sua solicitação de certificação ${requestCode} foi aprovada. Aguardando pagamento para emissão dos certificados.`;
      break;
      
    case 'rejected':
      title = 'Certificação Rejeitada';
      message = `Sua solicitação de certificação ${requestCode} foi rejeitada. Por favor, verifique os detalhes.`;
      break;
      
    case 'payment_confirmed':
      title = 'Pagamento Confirmado';
      message = `O pagamento da sua solicitação de certificação ${requestCode} foi confirmado. Os certificados serão processados em breve.`;
      break;
      
    case 'completed':
      title = 'Certificados Emitidos';
      message = `Sua solicitação de certificação ${requestCode} foi concluída. Os certificados estão disponíveis para download.`;
      break;
      
    case 'cancelled':
      title = 'Certificação Cancelada';
      message = `Sua solicitação de certificação ${requestCode} foi cancelada.`;
      break;
  }
  
  // Enviar a notificação
  return sendNotification(
    partnerId,
    'certification_status_change',
    title,
    message,
    {
      requestId,
      requestCode,
      oldStatus,
      newStatus,
      actionUrl: `/partner/certificacao/${requestId}`
    }
  );
}

/**
 * Envia notificação de certificado gerado
 */
export async function sendCertificateGeneratedNotification(
  partnerId: number,
  requestId: number,
  requestCode: string,
  studentName: string,
  courseName: string
): Promise<boolean> {
  const title = 'Novo Certificado Disponível';
  const message = `O certificado de ${studentName} para o curso "${courseName}" foi emitido e está disponível para download.`;
  
  return sendNotification(
    partnerId,
    'certificate_generated',
    title,
    message,
    {
      requestId,
      requestCode,
      actionUrl: `/partner/certificacao/${requestId}`
    }
  );
}

/**
 * Envia notificação de documento rejeitado
 */
export async function sendDocumentRejectedNotification(
  partnerId: number,
  requestId: number,
  requestCode: string,
  documentName: string,
  reason: string
): Promise<boolean> {
  const title = 'Documento Rejeitado';
  const message = `O documento "${documentName}" da solicitação ${requestCode} foi rejeitado. Motivo: ${reason}`;
  
  return sendNotification(
    partnerId,
    'document_rejected',
    title,
    message,
    {
      requestId,
      requestCode,
      rejectionReason: reason,
      actionUrl: `/partner/certificacao/${requestId}`
    }
  );
}

/**
 * Enviar notificação de pagamento recebido
 */
export async function sendPaymentReceivedNotification(
  partnerId: number,
  requestId: number,
  requestCode: string,
  paymentId: string,
  value: number
): Promise<boolean> {
  const title = 'Pagamento Recebido';
  const message = `O pagamento no valor de R$ ${value.toFixed(2)} para a solicitação ${requestCode} foi recebido com sucesso.`;
  
  return sendNotification(
    partnerId,
    'payment_received',
    title,
    message,
    {
      requestId,
      requestCode,
      paymentId,
      actionUrl: `/partner/certificacao/${requestId}`
    }
  );
}

/**
 * Enviar notificação de pagamento em atraso
 */
export async function sendPaymentOverdueNotification(
  partnerId: number,
  requestId: number,
  requestCode: string,
  paymentId: string,
  value: number,
  dueDate: string
): Promise<boolean> {
  const title = 'Pagamento em Atraso';
  const message = `O pagamento no valor de R$ ${value.toFixed(2)} para a solicitação ${requestCode} está em atraso desde ${dueDate}. Por favor, regularize o pagamento.`;
  
  return sendNotification(
    partnerId,
    'payment_overdue',
    title,
    message,
    {
      requestId,
      requestCode,
      paymentId,
      actionUrl: `/partner/certificacao/${requestId}`
    }
  );
}

/**
 * Traduz códigos de status para descrições amigáveis
 */
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'under_review': 'Em Análise',
    'approved': 'Aprovada',
    'rejected': 'Rejeitada',
    'payment_pending': 'Aguardando Pagamento',
    'payment_confirmed': 'Pagamento Confirmado',
    'processing': 'Em Processamento',
    'completed': 'Concluída',
    'cancelled': 'Cancelada'
  };
  
  return statusMap[status] || status;
}