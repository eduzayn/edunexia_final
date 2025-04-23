import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Tipos para as solicitações de certificação
export interface CertificationRequest {
  id: number;
  code: string;
  partnerId: number;
  institutionId: number;
  title: string;
  description?: string;
  totalStudents: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedById?: number;
  rejectionReason?: string;
  asaasPaymentId?: string;
  paymentLink?: string;
  invoiceUrl?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  paymentStatus?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Campos adicionados pelas relações
  partner?: {
    id: number;
    fullName: string;
    email: string;
  };
  institution?: {
    id: number;
    name: string;
    code: string;
  };
  students?: CertificationStudent[];
  documents?: CertificationDocument[];
  activityLogs?: CertificationActivityLog[];
}

export interface CertificationStudent {
  id: number;
  requestId: number;
  name: string;
  cpf: string;
  email: string;
  phone?: string;
  courseId: number;
  courseName: string;
  status: string;
  certificateId?: number;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  certificate?: Certificate;
}

export interface CertificationDocument {
  id: number;
  requestId: number;
  studentId?: number;
  type: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedAt?: string;
  verifiedById?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationActivityLog {
  id: number;
  requestId: number;
  action: string;
  description: string;
  performedById?: number;
  metadata?: any;
  performedAt: string;
  performedBy?: {
    id: number;
    fullName: string;
  };
}

export interface Certificate {
  id: number;
  code: string;
  studentName: string;
  cpf: string;
  courseId: number;
  courseName: string;
  workload: number;
  startDate: string;
  endDate: string;
  issuedAt: string;
  pdfUrl: string;
  verificationCode: string;
  status: string;
}

export interface CertificationRequestStats {
  institutionsCount: number;
  newInstitutionsLastMonth: number;
  totalCertificatesIssued: number;
  newCertificatesLastMonth: number;
  totalRevenue: number;
  revenueLastMonth: number;
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  paymentPending: number;
  paymentConfirmed: number;
  processing: number;
  completed: number;
  cancelled: number;
  recentRequests: CertificationRequest[];
  certificatesByInstitution: {
    institutionId: number;
    institutionName: string;
    count: number;
  }[];
}

interface CertificationFilter {
  status?: string;
  institution?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export function useCertificationRequests(filter: CertificationFilter = {}) {
  return useQuery({
    queryKey: ['/api/certification/requests', filter],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

export function useCertificationRequestDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['/api/certification/requests', id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id, // Só executa se id for válido
  });
}

export function useCertificationStats() {
  return useQuery({
    queryKey: ['/api/certification/stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

export function useApproveCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: number, reviewNotes?: string }) => {
      const res = await apiRequest("POST", `/api/certification/requests/${id}/approve`, { reviewNotes });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Solicitação aprovada",
        description: "A solicitação de certificação foi aprovada com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/certification/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useRejectCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: number, rejectionReason: string }) => {
      const res = await apiRequest("POST", `/api/certification/requests/${id}/reject`, { rejectionReason });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de certificação foi rejeitada.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/certification/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useProcessCertificates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/certification/requests/${id}/process-certificates`);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Processamento iniciado",
        description: "O processamento dos certificados foi iniciado com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests', variables] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar certificados",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      documentId, 
      status, 
      rejectionReason 
    }: { 
      documentId: number, 
      status: "verified" | "rejected", 
      rejectionReason?: string 
    }) => {
      const res = await apiRequest("POST", `/api/certification/documents/${documentId}/verify`, { 
        status, 
        rejectionReason 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      const action = data.status === "verified" ? "verificado" : "rejeitado";
      
      toast({
        title: `Documento ${action}`,
        description: `O documento foi ${action} com sucesso.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao verificar documento",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// Interface para a criação de solicitação em lote
export interface CreateBatchCertificationRequest {
  title: string;
  description?: string;
  institutionId: number;
  unitPrice: number;
  students: {
    name: string;
    cpf: string;
    email: string;
    phone?: string;
    courseId: number;
    courseName: string;
  }[];
}

// Hook para criar solicitações de certificação em lote
export function useCreateBatchCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (requestData: CreateBatchCertificationRequest) => {
      const res = await apiRequest("POST", `/api/certification/requests`, requestData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Solicitação enviada",
        description: "A solicitação de certificação foi enviada com sucesso e está aguardando pagamento.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certification/requests'] });
      
      // Se tiver link de pagamento, retornar na resposta para poder redirecionar
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  });
}