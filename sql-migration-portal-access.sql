-- Atualização do enum enrollment_status
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'waiting_payment';
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'payment_confirmed';
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'blocked';

-- Adição de colunas para gerenciamento de acesso nas matrículas
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS access_period_days INTEGER;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS block_reason TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS block_executed_at TIMESTAMP;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS block_ends_at TIMESTAMP;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Adição de campo para período de acesso na instituição
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS access_period_days INTEGER;

-- Criação de índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_enrollments_access_granted_at ON enrollments (access_granted_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_access_expires_at ON enrollments (access_expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_block_executed_at ON enrollments (block_executed_at);