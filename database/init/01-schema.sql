CREATE DATABASE IF NOT EXISTS app_db;
USE app_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255),
  email VARCHAR(160) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS setores (
  id_setor INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS maquinas (
  id_maquina INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  codigo_patrimonio VARCHAR(50) NULL,
  fabricante VARCHAR(100) NULL,
  modelo VARCHAR(100) NULL,
  numero_serie VARCHAR(100) NULL,
  ano_fabricacao YEAR NULL,
  data_aquisicao DATE NULL,
  data_ultima_manutencao DATE NULL,
  data_proxima_manutencao DATE NULL,
  localizacao VARCHAR(150) NULL,
  observacoes TEXT NULL,
  id_setor INT NOT NULL,
  `status` ENUM('ativa', 'inativa', 'manutencao'),
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_maquinas_serie (numero_serie),
  UNIQUE KEY uq_maquinas_patrimonio (codigo_patrimonio),
  FOREIGN KEY (id_setor) REFERENCES setores(id_setor)
);

CREATE TABLE IF NOT EXISTS tipos_ocorrencia (
  id_tipo INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ocorrencias (
  id_ocorrencia INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(180) NOT NULL,
  descricao TEXT NOT NULL,
  prioridade ENUM('Baixa','Média','Alta','Crítica') NOT NULL DEFAULT 'Média',
  status ENUM('Aberta','Em andamento','Aguardando','Resolvida','Cancelada') NOT NULL DEFAULT 'Aberta',
  id_setor INT NOT NULL,
  id_maquina INT NULL,
  id_tipo INT NOT NULL,
  id_usuario INT NULL,
  id_responsavel INT NULL,
  data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  prazo DATETIME NOT NULL,
  data_conclusao DATETIME NULL,
  causa TEXT NULL,
  solucao TEXT NULL,
  FOREIGN KEY (id_setor) REFERENCES setores(id_setor),
  FOREIGN KEY (id_maquina) REFERENCES maquinas(id_maquina),
  FOREIGN KEY (id_tipo) REFERENCES tipos_ocorrencia(id_tipo),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario),
  INDEX idx_ocorrencias_status_prazo (status, prazo),
  INDEX idx_ocorrencias_prioridade (prioridade)
);

CREATE TABLE IF NOT EXISTS historico_ocorrencias (
  id_historico INT AUTO_INCREMENT PRIMARY KEY,
  id_ocorrencia INT NOT NULL,
  id_usuario INT NOT NULL,
  acao VARCHAR(80) NOT NULL,
  detalhe TEXT NOT NULL,
  data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS evidencias (
  id_evidencia INT AUTO_INCREMENT PRIMARY KEY,
  id_ocorrencia INT NOT NULL,
  id_usuario INT NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  tamanho INT NOT NULL,
  data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
