-- Criar enums necessários
CREATE TYPE IF NOT EXISTS certification_request_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'payment_pending',
  'payment_confirmed',
  'processing',
  'completed',
  'cancelled'
);

CREATE TYPE IF NOT EXISTS document_verification_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

-- Criar tabela de solicitações de certificação
CREATE TABLE IF NOT EXISTS certification_requests (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  partner_id INTEGER NOT NULL REFERENCES users(id),
  institution_id INTEGER NOT NULL REFERENCES institutions(id),
  
  title TEXT NOT NULL,
  description TEXT,
  total_students INTEGER NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  
  status certification_request_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by_id INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  
  asaas_payment_id TEXT,
  payment_link TEXT,
  invoice_url TEXT,
  pix_qr_code_url TEXT,
  pix_copia_e_cola TEXT,
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de estudantes em solicitação
CREATE TABLE IF NOT EXISTS certification_students (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES certification_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  course_name TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending',
  certificate_id INTEGER REFERENCES certificates(id),
  observations TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS certification_documents (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES certification_requests(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES certification_students(id),
  type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  verification_status document_verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by_id INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de logs de atividade
CREATE TABLE IF NOT EXISTS certification_activity_logs (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES certification_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by_id INTEGER REFERENCES users(id),
  metadata JSONB,
  performed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_certification_requests_partner_id ON certification_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_certification_requests_status ON certification_requests(status);
CREATE INDEX IF NOT EXISTS idx_certification_students_request_id ON certification_students(request_id);
CREATE INDEX IF NOT EXISTS idx_certification_documents_request_id ON certification_documents(request_id);
CREATE INDEX IF NOT EXISTS idx_certification_documents_student_id ON certification_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_certification_activity_logs_request_id ON certification_activity_logs(request_id);