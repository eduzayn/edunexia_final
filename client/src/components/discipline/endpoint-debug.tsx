import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EndpointDebugProps {
  url: string;
}

export default function EndpointDebug({ url }: EndpointDebugProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obter token do localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      console.log("Dados recebidos do endpoint:", url, jsonData);
      setData(jsonData);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Debug do Endpoint: {url}</h3>
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="bg-slate-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}