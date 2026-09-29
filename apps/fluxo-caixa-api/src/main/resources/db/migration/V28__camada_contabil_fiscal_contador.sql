CREATE TABLE classificacoes_contabeis (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(500),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_classificacoes_contabeis_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT uk_classificacoes_contabeis_empresa_nome
        UNIQUE (empresa_id, nome)
);

CREATE TABLE analises_fiscais_movimentacao (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    movimentacao_id BIGINT NOT NULL,
    classificacao_contabil_id BIGINT NULL,
    tratamento_fiscal VARCHAR(40) NOT NULL DEFAULT 'PENDENTE_ANALISE',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    valor_considerado DECIMAL(19, 2) NULL,
    observacao VARCHAR(1000),
    validado_por_usuario_id BIGINT NULL,
    validado_em TIMESTAMP(6) NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_analises_fiscais_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_analises_fiscais_movimentacao
        FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes (id),
    CONSTRAINT fk_analises_fiscais_classificacao
        FOREIGN KEY (classificacao_contabil_id) REFERENCES classificacoes_contabeis (id),
    CONSTRAINT fk_analises_fiscais_usuario
        FOREIGN KEY (validado_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT uk_analises_fiscais_movimentacao
        UNIQUE (movimentacao_id),
    CONSTRAINT chk_analises_fiscais_tratamento
        CHECK (tratamento_fiscal IN (
            'PENDENTE_ANALISE',
            'POTENCIALMENTE_DEDUTIVEL',
            'NAO_DEDUTIVEL',
            'PARCIALMENTE_CONSIDERADO',
            'VALIDADO_PELO_CONTADOR',
            'DOCUMENTO_INSUFICIENTE',
            'PENDENTE_DOCUMENTO'
        )),
    CONSTRAINT chk_analises_fiscais_status
        CHECK (status IN (
            'PENDENTE',
            'EM_ANALISE',
            'AGUARDANDO_CLIENTE',
            'VALIDADO',
            'REJEITADO',
            'CORRIGIR',
            'CONCLUIDO'
        ))
);

CREATE INDEX idx_analises_fiscais_empresa_status
    ON analises_fiscais_movimentacao (empresa_id, status, tratamento_fiscal);

CREATE TABLE regimes_tributarios_empresa (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    regime VARCHAR(40) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    competencia VARCHAR(20),
    situacao VARCHAR(30) NOT NULL DEFAULT 'ATIVO',
    observacao VARCHAR(1000),
    responsavel_usuario_id BIGINT NULL,
    revisado_em TIMESTAMP(6) NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_regimes_tributarios_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_regimes_tributarios_responsavel
        FOREIGN KEY (responsavel_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_regimes_tributarios_regime
        CHECK (regime IN (
            'MEI',
            'SIMPLES_NACIONAL',
            'LUCRO_PRESUMIDO',
            'LUCRO_REAL',
            'PESSOA_FISICA',
            'PRODUTOR_RURAL_PF',
            'OUTRO'
        ))
);

CREATE INDEX idx_regimes_tributarios_empresa_inicio
    ON regimes_tributarios_empresa (empresa_id, data_inicio, situacao);

CREATE TABLE parametros_tributarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    regime VARCHAR(40) NOT NULL,
    competencia VARCHAR(20) NOT NULL,
    nome VARCHAR(80),
    aliquota_percentual DECIMAL(9, 4) NULL,
    parcela_deduzir DECIMAL(19, 2) NULL,
    observacao VARCHAR(1000),
    criado_por_usuario_id BIGINT NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_parametros_tributarios_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_parametros_tributarios_usuario
        FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_parametros_tributarios_regime
        CHECK (regime IN (
            'MEI',
            'SIMPLES_NACIONAL',
            'LUCRO_PRESUMIDO',
            'LUCRO_REAL',
            'PESSOA_FISICA',
            'PRODUTOR_RURAL_PF',
            'OUTRO'
        ))
);

CREATE INDEX idx_parametros_tributarios_empresa_regime_competencia
    ON parametros_tributarios (empresa_id, regime, competencia);
