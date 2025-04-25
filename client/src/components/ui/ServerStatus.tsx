import { useEffect, useState } from 'react';
import { checkApiHealth } from '../../lib/api-config';

type ServerStatusProps = {
  className?: string;
  showText?: boolean;
};

/**
 * Componente que mostra o status de conexão com o servidor
 * Útil para indicar problemas de conectividade na aplicação
 */
export function ServerStatus({ className = '', showText = true }: ServerStatusProps) {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    const checkServer = async () => {
      const isOnline = await checkApiHealth();
      setStatus(isOnline ? 'online' : 'offline');
    };

    checkServer();

    // Verificar o status a cada 30 segundos
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determina a cor do indicador com base no status
  const statusColor = {
    loading: 'bg-yellow-400',
    online: 'bg-green-500',
    offline: 'bg-red-500'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`h-2.5 w-2.5 rounded-full ${statusColor[status]} animate-pulse`} />
      {showText && (
        <span className="text-xs">
          {status === 'loading' && 'Verificando conexão...'}
          {status === 'online' && 'Servidor conectado'}
          {status === 'offline' && 'Servidor indisponível'}
        </span>
      )}
    </div>
  );
}

export default ServerStatus; 