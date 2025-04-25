-- Migração para adicionar tabela de cache
-- Esta tabela será usada para armazenar dados de cache persistente entre invocações de funções serverless

-- Verifica se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cache_items') THEN
        -- Cria a tabela de cache
        CREATE TABLE public.cache_items (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Adiciona índice para expiração para otimizar limpezas
        CREATE INDEX idx_cache_items_expires_at ON public.cache_items (expires_at);
        
        -- Comentários para documentação
        COMMENT ON TABLE public.cache_items IS 'Armazena itens de cache para uso entre invocações de funções serverless';
        COMMENT ON COLUMN public.cache_items.key IS 'Chave única para identificar o item de cache';
        COMMENT ON COLUMN public.cache_items.value IS 'Valor serializado em JSON';
        COMMENT ON COLUMN public.cache_items.expires_at IS 'Timestamp de expiração do item (NULL = não expira)';
        COMMENT ON COLUMN public.cache_items.created_at IS 'Timestamp de criação do item';
    END IF;
END
$$; 