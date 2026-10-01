CREATE TABLE official_cnpj_cache (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cnpj VARCHAR(14) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    situacao_cadastral VARCHAR(80),
    natureza_juridica VARCHAR(120),
    porte VARCHAR(80),
    cnae_principal VARCHAR(120),
    logradouro VARCHAR(150),
    numero VARCHAR(30),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cep VARCHAR(12),
    municipio VARCHAR(100),
    uf VARCHAR(2),
    fonte VARCHAR(255),
    consultado_em DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_official_cnpj_cache_lookup (cnpj, provider, consultado_em)
);

CREATE TABLE tax_sources (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    url VARCHAR(500),
    ato_normativo VARCHAR(180),
    data_publicacao DATE,
    data_consulta DATETIME(6),
    vigencia_inicio DATE,
    vigencia_fim DATE,
    PRIMARY KEY (id),
    INDEX idx_tax_sources_tipo_vigencia (tipo, vigencia_inicio, vigencia_fim)
);

CREATE TABLE tax_rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    source_id BIGINT NOT NULL,
    regime VARCHAR(40) NOT NULL,
    versao VARCHAR(40) NOT NULL,
    competencia VARCHAR(20),
    vigencia_inicio DATE NOT NULL,
    vigencia_fim DATE,
    aliquota_percentual DECIMAL(10, 4),
    parcela_deduzir DECIMAL(15, 2),
    status VARCHAR(40) NOT NULL,
    premissas VARCHAR(1000),
    PRIMARY KEY (id),
    CONSTRAINT fk_tax_rules_source
        FOREIGN KEY (source_id)
        REFERENCES tax_sources (id),
    INDEX idx_tax_rules_regime_status_vigencia
        (regime, status, vigencia_inicio, vigencia_fim),
    INDEX idx_tax_rules_competencia (competencia)
);
