import { useCallback, useState } from 'react';
import { fetchApi, ApiError } from '../lib/api-config';

/**
 * Hook personalizado para chamadas à API com gerenciamento de estado de loading e erro
 */
export function useApi() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Função genérica para fazer chamadas à API
  const callApi = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchApi<T>(endpoint, options);
      return result;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Métodos convenientes para diferentes tipos de chamadas
  const get = useCallback(<T>(endpoint: string, options: RequestInit = {}) => {
    return callApi<T>(endpoint, { ...options, method: 'GET' });
  }, [callApi]);

  const post = useCallback(<T>(endpoint: string, data: any, options: RequestInit = {}) => {
    return callApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, [callApi]);

  const put = useCallback(<T>(endpoint: string, data: any, options: RequestInit = {}) => {
    return callApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }, [callApi]);

  const del = useCallback(<T>(endpoint: string, options: RequestInit = {}) => {
    return callApi<T>(endpoint, { ...options, method: 'DELETE' });
  }, [callApi]);

  return {
    get,
    post,
    put,
    del,
    loading,
    error,
    clearError: () => setError(null)
  };
}

export default useApi; 