import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, institutions } from '@shared/schema';
import { 
  certificationRequests,
  certificationStudents
} from '@shared/certification-request-schema';
import { certificates } from '@shared/certificate-schema';
import { eq, and, sql, count, sum, gte, desc } from 'drizzle-orm';
import { getDateXMonthsAgo } from '../utils/date-utils';

const router = Router();

/**
 * Rota para obter estatísticas de certificações
 * GET /api/certification/stats
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }

    const user = req.user;
    
    // Verifica se o usuário é administrador ou parceiro
    if (user.role !== 'admin' && user.portalType !== 'partner') {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    // Obtém a data de um mês atrás
    const oneMonthAgo = getDateXMonthsAgo(1);

    // Contagem de instituições
    const institutionsCountResult = await db
      .select({ count: count() })
      .from(institutions)
      .where(eq(institutions.active, true));

    // Contagem de instituições novas no último mês
    const newInstitutionsResult = await db
      .select({ count: count() })
      .from(institutions)
      .where(
        and(
          eq(institutions.active, true),
          gte(institutions.createdAt, oneMonthAgo)
        )
      );

    // Total de certificados emitidos
    const certificatesCountResult = await db
      .select({ count: count() })
      .from(certificates);

    // Novos certificados no último mês
    const newCertificatesResult = await db
      .select({ count: count() })
      .from(certificates)
      .where(gte(certificates.issuedAt, oneMonthAgo));

    // Valor total gerado
    const totalRevenueResult = await db
      .select({ total: sum(certificationRequests.totalAmount) })
      .from(certificationRequests)
      .where(eq(certificationRequests.status, 'completed'));

    // Valor gerado no último mês
    const revenueLastMonthResult = await db
      .select({ total: sum(certificationRequests.totalAmount) })
      .from(certificationRequests)
      .where(
        and(
          eq(certificationRequests.status, 'completed'),
          gte(certificationRequests.updatedAt, oneMonthAgo)
        )
      );

    // Solicitações pendentes
    const pendingCountResult = await db
      .select({ count: count() })
      .from(certificationRequests)
      .where(eq(certificationRequests.status, 'pending'));

    // Solicitações em análise
    const underReviewCountResult = await db
      .select({ count: count() })
      .from(certificationRequests)
      .where(eq(certificationRequests.status, 'under_review'));

    // Solicitações aguardando pagamento
    const paymentPendingCountResult = await db
      .select({ count: count() })
      .from(certificationRequests)
      .where(eq(certificationRequests.status, 'payment_pending'));

    // Certificações por instituição
    const certificatesByInstitutionResult = await db
      .select({
        institutionName: institutions.name,
        count: count(),
      })
      .from(certificationRequests)
      .innerJoin(institutions, eq(certificationRequests.institutionId, institutions.id))
      .where(eq(certificationRequests.status, 'completed'))
      .groupBy(institutions.name)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      institutionsCount: institutionsCountResult[0]?.count || 0,
      newInstitutionsLastMonth: newInstitutionsResult[0]?.count || 0,
      totalCertificatesIssued: certificatesCountResult[0]?.count || 0,
      newCertificatesLastMonth: newCertificatesResult[0]?.count || 0,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      revenueLastMonth: revenueLastMonthResult[0]?.total || 0,
      pending: pendingCountResult[0]?.count || 0,
      underReview: underReviewCountResult[0]?.count || 0,
      paymentPending: paymentPendingCountResult[0]?.count || 0,
      certificatesByInstitution: certificatesByInstitutionResult,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de certificação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar a solicitação', 
      error: (error as Error).message 
    });
  }
});

export default router;