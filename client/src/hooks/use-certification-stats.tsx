import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { CertificationRequestStats } from './use-certification-requests';

/**
 * Hook para buscar estatísticas das certificações
 */
export function useCertificationStats() {
  return useQuery<CertificationRequestStats, Error>({
    queryKey: ['/api/certification/stats'],
    queryFn: getQueryFn({ on401: 'throw' }),
    refetchOnWindowFocus: false,
    // Atualiza a cada 5 minutos
    refetchInterval: 5 * 60 * 1000,
  });
}