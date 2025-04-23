import express from "express";
import { db } from "../db";
import { users, institutions, courses } from "@shared/schema";
import { certificates } from "@shared/certificate-schema";
import {
  certificationRequests,
  certificationStudents,
  certificationRequestStatusEnum
} from "@shared/certification-request-schema";
import { eq, and, count, sum, desc, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Rota para obter estatísticas de certificação para o painel administrativo
router.get("/certification/stats", requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.portalType !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    // Obter a data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // Total de instituições parceiras
    const institutionsResult = await db.select({
      count: count()
    }).from(institutions);

    // Novas instituições no último mês
    const newInstitutionsResult = await db.select({
      count: count()
    }).from(institutions)
    .where(gte(institutions.createdAt, thirtyDaysAgoStr));

    // Total de certificados emitidos
    const certificatesResult = await db.select({
      count: count()
    }).from(certificates);

    // Novos certificados no último mês
    const newCertificatesResult = await db.select({
      count: count()
    }).from(certificates)
    .where(gte(certificates.issuedAt, thirtyDaysAgoStr));

    // Receita total e do último mês
    const revenueResult = await db.select({
      total: sum(certificationRequests.totalAmount)
    }).from(certificationRequests)
    .where(
      and(
        eq(certificationRequests.status, "payment_confirmed"),
      )
    );

    const recentRevenueResult = await db.select({
      total: sum(certificationRequests.totalAmount)
    }).from(certificationRequests)
    .where(
      and(
        eq(certificationRequests.status, "payment_confirmed"),
        gte(certificationRequests.paidAt, thirtyDaysAgoStr)
      )
    );

    // Contagem de certificações por status
    const statusValues = ["pending", "under_review", "approved", "rejected", "payment_pending", "payment_confirmed", "processing", "completed", "cancelled"];
    
    const statusCounts = await Promise.all(
      statusValues.map(async (status) => {
        const result = await db.select({
          count: count()
        }).from(certificationRequests)
        .where(eq(certificationRequests.status, status));
        
        return { status, count: result[0].count };
      })
    );

    // Reduzir as contagens em um objeto único
    const statusCountsObj = statusCounts.reduce((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {} as Record<string, number>);

    // Solicitações recentes
    const recentRequests = await db.select({
        certification_requests: certificationRequests,
        institutions: institutions,
        users: users
      })
      .from(certificationRequests)
      .leftJoin(institutions, eq(certificationRequests.institutionId, institutions.id))
      .leftJoin(users, eq(certificationRequests.partnerId, users.id))
      .orderBy(desc(certificationRequests.createdAt))
      .limit(5);

    // Certificados por instituição
    const certificatesByInstitution = await db.select({
      institutionId: institutions.id,
      institutionName: institutions.name,
      count: count()
    })
    .from(certificates)
    .leftJoin(certificationStudents, eq(certificates.id, certificationStudents.certificateId))
    .leftJoin(certificationRequests, eq(certificationStudents.requestId, certificationRequests.id))
    .leftJoin(institutions, eq(certificationRequests.institutionId, institutions.id))
    .groupBy(institutions.id, institutions.name)
    .orderBy(desc(count()))
    .limit(5);

    // Formatar dados para a resposta
    const stats = {
      institutionsCount: institutionsResult[0].count,
      newInstitutionsLastMonth: newInstitutionsResult[0].count,
      totalCertificatesIssued: certificatesResult[0].count,
      newCertificatesLastMonth: newCertificatesResult[0].count,
      totalRevenue: revenueResult[0].total || 0,
      revenueLastMonth: recentRevenueResult[0].total || 0,
      total: Object.values(statusCountsObj).reduce((sum, count) => sum + count, 0),
      pending: statusCountsObj["pending"] || 0,
      underReview: statusCountsObj["under_review"] || 0,
      approved: statusCountsObj["approved"] || 0,
      rejected: statusCountsObj["rejected"] || 0,
      paymentPending: statusCountsObj["payment_pending"] || 0,
      paymentConfirmed: statusCountsObj["payment_confirmed"] || 0,
      processing: statusCountsObj["processing"] || 0,
      completed: statusCountsObj["completed"] || 0,
      cancelled: statusCountsObj["cancelled"] || 0,
      // Estruturar as solicitações recentes
      recentRequests: recentRequests.map((row) => ({
        id: row.certification_requests.id,
        code: row.certification_requests.code,
        title: row.certification_requests.title,
        totalStudents: row.certification_requests.totalStudents,
        totalAmount: row.certification_requests.totalAmount,
        status: row.certification_requests.status,
        submittedAt: row.certification_requests.submittedAt,
        institution: row.institutions ? {
          id: row.institutions.id,
          name: row.institutions.name,
          code: row.institutions.code
        } : null,
        partner: row.users ? {
          id: row.users.id,
          fullName: row.users.fullName,
          email: row.users.email
        } : null
      })),
      certificatesByInstitution
    };

    res.json(stats);
  } catch (error) {
    console.error("Erro ao obter estatísticas de certificação:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas de certificação" });
  }
});

export default router;