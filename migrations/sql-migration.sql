-- Adicionar enum access_type
CREATE TYPE access_type AS ENUM ('after_link_completion', 'after_payment_confirmation');

-- Adicionar novos status ao enum simplified_enrollment_status
ALTER TYPE simplified_enrollment_status ADD VALUE IF NOT EXISTS 'waiting_payment';
ALTER TYPE simplified_enrollment_status ADD VALUE IF NOT EXISTS 'payment_confirmed';
ALTER TYPE simplified_enrollment_status ADD VALUE IF NOT EXISTS 'blocked';

-- Adicionar novos campos à tabela de instituições
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS enrollment_access_type access_type DEFAULT 'after_link_completion',
ADD COLUMN IF NOT EXISTS days_until_block INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS days_until_cancellation INTEGER DEFAULT 30;

-- Adicionar novos campos à tabela simplified_enrollments
ALTER TABLE simplified_enrollments
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS block_scheduled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS block_executed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_scheduled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_executed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP;

-- Criar tabela de log de mudanças de status
CREATE TABLE IF NOT EXISTS simplified_enrollment_status_log (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES simplified_enrollments(id) ON DELETE CASCADE,
  previous_status simplified_enrollment_status,
  new_status simplified_enrollment_status NOT NULL,
  change_date TIMESTAMP NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  changed_by_id INTEGER REFERENCES users(id),
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT
);
