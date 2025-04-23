-- Criar enums necessários para certificados
CREATE TYPE certificate_status AS ENUM ('draft', 'pending', 'issued', 'revoked');
CREATE TYPE certificate_type AS ENUM ('graduation', 'postgrad', 'extension', 'free_course');

-- Criar tabela de templates de certificados
CREATE TABLE IF NOT EXISTS certificate_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type certificate_type NOT NULL DEFAULT 'postgrad',
  default_title VARCHAR(100) DEFAULT 'Certificado de Conclusão',
  header_html TEXT,
  body_html TEXT,
  footer_html TEXT,
  css_styles TEXT,
  background_image_url VARCHAR(255),
  preview_image_url VARCHAR(255),
  logo_position VARCHAR(20) DEFAULT 'top-center',
  orientation VARCHAR(20) DEFAULT 'landscape',
  paper_size VARCHAR(10) DEFAULT 'A4',
  institution_id INTEGER REFERENCES institutions(id),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Criar tabela de signatários de certificados
CREATE TABLE IF NOT EXISTS certificate_signers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  institution_id INTEGER REFERENCES institutions(id),
  signature_image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  student_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  course_name VARCHAR(150) NOT NULL,
  course_type VARCHAR(50) NOT NULL,
  title VARCHAR(100) DEFAULT 'Certificado de Conclusão',
  template_id INTEGER REFERENCES certificate_templates(id),
  signer_id INTEGER REFERENCES certificate_signers(id),
  institution_id INTEGER REFERENCES institutions(id),
  student_birthplace VARCHAR(100),
  completion_date TIMESTAMP,
  total_workload INTEGER,
  status certificate_status DEFAULT 'draft' NOT NULL,
  issued_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,
  metadata JSONB,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Criar tabela de disciplinas do certificado
CREATE TABLE IF NOT EXISTS certificate_disciplines (
  id SERIAL PRIMARY KEY,
  certificate_id INTEGER NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  discipline_id INTEGER REFERENCES disciplines(id),
  discipline_name VARCHAR(150) NOT NULL,
  workload INTEGER NOT NULL,
  professor_name VARCHAR(150),
  professor_title VARCHAR(100),
  attendance INTEGER,
  performance INTEGER,
  grade NUMERIC(4,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Criar tabela de histórico de certificados
CREATE TABLE IF NOT EXISTS certificate_history (
  id SERIAL PRIMARY KEY,
  certificate_id INTEGER NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  performed_by_id INTEGER REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificate_disciplines_certificate_id ON certificate_disciplines(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_history_certificate_id ON certificate_history(certificate_id);

-- Inserir template padrão para pós-graduação
INSERT INTO certificate_templates (
  name, 
  description, 
  type, 
  default_title, 
  header_html,
  body_html,
  footer_html,
  css_styles,
  orientation,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Template Padrão - Pós-Graduação',
  'Certificado oficial para conclusão de cursos de pós-graduação',
  'postgrad',
  'Certificado de Conclusão',
  '<div class="header">
    <div class="logo">
      <img src="/assets/certificates/institution-logo.svg" alt="Logo da instituição">
    </div>
    <h1>CERTIFICADO</h1>
  </div>',
  '<div class="body">
    <p class="preamble">A <strong>{{institution_name}}</strong>, credenciada pelo MEC, certifica que</p>
    <p class="student-name">{{student_name}}</p>
    <p class="conclusion-text">concluiu com aproveitamento o curso de <strong>Pós-Graduação Lato Sensu</strong> em</p>
    <p class="course-name">{{course_name}}</p>
    <p class="details">com carga horária total de <strong>{{total_workload}} horas</strong>, tendo cumprido todas as exigências acadêmicas do curso, conforme legislação vigente.</p>
    <div class="date-location">
      <p>{{city}}, {{issue_date}}</p>
    </div>
    <div class="signatures">
      <div class="signature">
        <img src="/assets/certificates/signature.svg" alt="Assinatura">
        <p>{{signer_name}}</p>
        <p>{{signer_role}}</p>
      </div>
    </div>
  </div>',
  '<div class="footer">
    <div class="verification">
      <p>Certificado registrado sob o código: <strong>{{certificate_code}}</strong></p>
      <p>Verificar autenticidade em: <strong>{{verification_url}}</strong></p>
      <div class="qrcode">
        <img src="{{qrcode_url}}" alt="QR Code para verificação">
      </div>
    </div>
    <div class="seal">
      <img src="/assets/certificates/certificate-seal.svg" alt="Selo oficial">
    </div>
  </div>',
  'body {
    font-family: "Times New Roman", Times, serif;
    color: #333;
    margin: 0;
    padding: 20px;
    background-color: #fff;
  }
  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  .header h1 {
    font-size: 36px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 20px;
  }
  .logo img {
    max-width: 200px;
    max-height: 100px;
  }
  .body {
    margin: 0 60px;
    text-align: center;
  }
  .preamble {
    font-size: 16px;
    margin-bottom: 20px;
  }
  .student-name {
    font-size: 28px;
    font-weight: bold;
    margin: 30px 0;
    text-transform: uppercase;
  }
  .conclusion-text {
    font-size: 16px;
    margin: 20px 0;
  }
  .course-name {
    font-size: 24px;
    font-weight: bold;
    margin: 20px 0;
    text-transform: uppercase;
  }
  .details {
    font-size: 16px;
    margin: 20px 0 40px 0;
  }
  .date-location {
    margin: 30px 0;
    font-size: 16px;
  }
  .signatures {
    display: flex;
    justify-content: center;
    margin-top: 60px;
  }
  .signature {
    margin: 0 40px;
    text-align: center;
  }
  .signature img {
    max-width: 150px;
    margin-bottom: 10px;
  }
  .footer {
    margin-top: 60px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .verification {
    font-size: 12px;
    text-align: left;
  }
  .qrcode img {
    width: 80px;
    height: 80px;
    margin-top: 10px;
  }
  .seal img {
    max-width: 120px;
    max-height: 120px;
  }',
  'landscape',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Inserir template alternativo para pós-graduação
INSERT INTO certificate_templates (
  name, 
  description, 
  type, 
  default_title, 
  header_html,
  body_html,
  footer_html,
  css_styles,
  orientation,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Template Alternativo - Pós-Graduação',
  'Layout alternativo para certificados de pós-graduação',
  'postgrad',
  'Certificado de Conclusão',
  '<div class="header">
    <div class="logo">
      <img src="/assets/certificates/institution-logo.svg" alt="Logo da instituição">
    </div>
    <h1>CERTIFICADO DE CONCLUSÃO</h1>
  </div>',
  '<div class="body">
    <div class="content">
      <p class="certification">Certificamos que</p>
      <p class="student-name">{{student_name}}</p>
      <p class="document">Documento de Identidade: {{student_document}}</p>
      <p class="course-info">concluiu o curso de <strong>Pós-Graduação Lato Sensu</strong> em</p>
      <p class="course-name">{{course_name}}</p>
      <p class="details">Concluído em {{completion_date}}, com carga horária total de {{total_workload}} horas, tendo obtido aproveitamento satisfatório em todas as disciplinas, de acordo com as normas do MEC.</p>
    </div>
    <div class="date-location">
      <p>{{city}}, {{issue_date}}</p>
    </div>
    <div class="signatures">
      <div class="signature coordinator">
        <img src="/assets/certificates/signature.svg" alt="Assinatura">
        <p>{{signer_name}}</p>
        <p>{{signer_role}}</p>
      </div>
      <div class="signature director">
        <img src="/assets/certificates/signature.svg" alt="Assinatura">
        <p>Diretor(a) Acadêmico(a)</p>
      </div>
    </div>
  </div>',
  '<div class="footer">
    <div class="verification">
      <p>Certificado registrado sob o código: <strong>{{certificate_code}}</strong></p>
      <p>Verificar autenticidade em: <strong>{{verification_url}}</strong></p>
      <div class="qrcode">
        <img src="{{qrcode_url}}" alt="QR Code para verificação">
      </div>
    </div>
    <div class="seal">
      <img src="/assets/certificates/certificate-seal.svg" alt="Selo oficial">
    </div>
  </div>',
  'body {
    font-family: "Arial", sans-serif;
    color: #333;
    margin: 0;
    padding: 20px;
    background-color: #fff;
    background-image: linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url("/assets/certificates/background-pattern.svg");
    background-size: cover;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 2px solid #0d47a1;
    padding-bottom: 20px;
  }
  .header h1 {
    font-size: 28px;
    font-weight: bold;
    color: #0d47a1;
    margin-top: 15px;
  }
  .logo img {
    max-width: 180px;
    max-height: 90px;
  }
  .body {
    margin: 0 40px;
    text-align: center;
  }
  .content {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 3px 6px rgba(0,0,0,0.1);
    margin-bottom: 30px;
  }
  .certification {
    font-size: 16px;
    margin-bottom: 15px;
  }
  .student-name {
    font-size: 26px;
    font-weight: bold;
    margin: 25px 0 10px;
    color: #0d47a1;
  }
  .document {
    font-size: 14px;
    margin-bottom: 25px;
    color: #555;
  }
  .course-info {
    font-size: 16px;
    margin: 15px 0;
  }
  .course-name {
    font-size: 22px;
    font-weight: bold;
    margin: 15px 0;
    color: #0d47a1;
  }
  .details {
    font-size: 14px;
    margin: 20px 0;
    line-height: 1.5;
  }
  .date-location {
    margin: 20px 0;
    font-size: 14px;
    font-style: italic;
  }
  .signatures {
    display: flex;
    justify-content: space-around;
    margin-top: 40px;
  }
  .signature {
    margin: 0 20px;
    text-align: center;
  }
  .signature img {
    max-width: 130px;
    margin-bottom: 5px;
  }
  .signature p {
    font-size: 12px;
    margin: 3px 0;
  }
  .signature p:first-of-type {
    font-weight: bold;
  }
  .footer {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid #0d47a1;
    padding-top: 15px;
  }
  .verification {
    font-size: 11px;
    text-align: left;
  }
  .qrcode img {
    width: 70px;
    height: 70px;
    margin-top: 8px;
  }
  .seal img {
    max-width: 100px;
    max-height: 100px;
  }',
  'landscape',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Inserir signatário padrão
INSERT INTO certificate_signers (
  name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Prof. Dr. Carlos Alberto',
  'Coordenador de Pós-Graduação',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);