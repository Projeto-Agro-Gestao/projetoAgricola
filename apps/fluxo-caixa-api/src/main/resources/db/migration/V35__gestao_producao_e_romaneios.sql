CREATE TABLE safras_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 empresa_id BIGINT NOT NULL,
 propriedade_id BIGINT NOT NULL,
 nome VARCHAR(120) NOT NULL,
 cultura VARCHAR(80) NOT NULL,
 talhao VARCHAR(120) NOT NULL,
 area_hectares DECIMAL(19,4) NOT NULL,
 inicio DATE NOT NULL,
 fim DATE NOT NULL,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (empresa_id, propriedade_id, nome, talhao),
 FOREIGN KEY (empresa_id) REFERENCES empresas(id),
 FOREIGN KEY (propriedade_id) REFERENCES propriedades_rurais(id),
 CHECK (area_hectares > 0), CHECK (fim >= inicio)
);
CREATE TABLE romaneios_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 empresa_id BIGINT NOT NULL,
 documento_id BIGINT NOT NULL,
 hash_arquivo CHAR(64) NOT NULL,
 texto_extraido TEXT,
 sugestoes_json TEXT,
 status VARCHAR(30) NOT NULL DEFAULT 'CONFERIR',
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (empresa_id, hash_arquivo),
 FOREIGN KEY (empresa_id) REFERENCES empresas(id),
 FOREIGN KEY (documento_id) REFERENCES documentos_agro(id)
);
CREATE TABLE operacoes_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 empresa_id BIGINT NOT NULL,
 safra_id BIGINT NOT NULL,
 romaneio_id BIGINT NULL,
 movimentacao_id BIGINT NULL,
 chave VARCHAR(64) NOT NULL,
 tipo VARCHAR(30) NOT NULL,
 descricao VARCHAR(150) NOT NULL,
 data_operacao DATE NOT NULL,
 quantidade_kg DECIMAL(19,3) NOT NULL DEFAULT 0,
 umidade DECIMAL(7,4) NOT NULL DEFAULT 0,
 impurezas DECIMAL(7,4) NOT NULL DEFAULT 0,
 desconto_kg DECIMAL(19,3) NOT NULL DEFAULT 0,
 peso_liquido_kg DECIMAL(19,3) NOT NULL DEFAULT 0,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (empresa_id, chave), UNIQUE (romaneio_id), UNIQUE (movimentacao_id),
 FOREIGN KEY (empresa_id) REFERENCES empresas(id),
 FOREIGN KEY (safra_id) REFERENCES safras_agro(id),
 FOREIGN KEY (romaneio_id) REFERENCES romaneios_agro(id),
 FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id),
 CHECK (quantidade_kg >= 0), CHECK (peso_liquido_kg >= 0),
 CHECK (umidade BETWEEN 0 AND 100), CHECK (impurezas BETWEEN 0 AND 100)
);
CREATE INDEX idx_operacoes_safra ON operacoes_agro(empresa_id, safra_id, data_operacao);
