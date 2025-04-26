
-- Criação das tabelas para o módulo pedagógico

-- Tabela para vídeos
CREATE TABLE IF NOT EXISTS discipline_videos (
  id SERIAL PRIMARY KEY,
  discipline_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

-- Tabela para e-books (estáticos e interativos)
CREATE TABLE IF NOT EXISTS discipline_ebooks (
  id SERIAL PRIMARY KEY,
  discipline_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  filename VARCHAR(255),
  type VARCHAR(20) NOT NULL, -- 'static' ou 'interactive'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

-- Tabela para simulados
CREATE TABLE IF NOT EXISTS discipline_simulados (
  id SERIAL PRIMARY KEY,
  discipline_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INTEGER DEFAULT 60, -- tempo em minutos
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

-- Tabela para questões de simulados
CREATE TABLE IF NOT EXISTS discipline_questoes (
  id SERIAL PRIMARY KEY,
  simulado_id INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  alternativas TEXT[] NOT NULL,
  resposta_correta INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (simulado_id) REFERENCES discipline_simulados(id) ON DELETE CASCADE
);

-- Tabela para avaliações finais
CREATE TABLE IF NOT EXISTS discipline_avaliacao_final (
  id SERIAL PRIMARY KEY,
  discipline_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INTEGER DEFAULT 90, -- tempo em minutos
  passing_score INTEGER DEFAULT 70, -- nota de corte (0-100)
  max_attempts INTEGER DEFAULT 3,
  show_explanations BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

-- Tabela para questões de avaliações finais
CREATE TABLE IF NOT EXISTS discipline_questoes_avaliacao (
  id SERIAL PRIMARY KEY,
  avaliacao_id INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  alternativas TEXT[] NOT NULL,
  resposta_correta INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (avaliacao_id) REFERENCES discipline_avaliacao_final(id) ON DELETE CASCADE
);

-- Índices para melhorar a performance
CREATE INDEX idx_discipline_videos_discipline_id ON discipline_videos(discipline_id);
CREATE INDEX idx_discipline_ebooks_discipline_id ON discipline_ebooks(discipline_id);
CREATE INDEX idx_discipline_simulados_discipline_id ON discipline_simulados(discipline_id);
CREATE INDEX idx_discipline_avaliacao_final_discipline_id ON discipline_avaliacao_final(discipline_id);
CREATE INDEX idx_discipline_questoes_simulado_id ON discipline_questoes(simulado_id);
CREATE INDEX idx_discipline_questoes_avaliacao_avaliacao_id ON discipline_questoes_avaliacao(avaliacao_id);
