-- Migration para adicionar o campo asaas_id à tabela de usuários
-- Data: 2025-04-23

-- Adicionar coluna asaas_id à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS asaas_id TEXT;

-- Comentário para facilitar identificação da coluna
COMMENT ON COLUMN users.asaas_id IS 'ID do cliente no Asaas para integrações de pagamento';