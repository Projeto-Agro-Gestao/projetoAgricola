ALTER TABLE usuarios DROP CHECK chk_usuarios_papel;

ALTER TABLE usuarios
    ADD CONSTRAINT chk_usuarios_papel
        CHECK (
            papel IN (
                'PROPRIETARIO',
                'PRODUTOR',
                'CONTADOR',
                'ADMINISTRADOR',
                'SUPER_ADMIN',
                'FUNCIONARIO'
            )
        );

CREATE TABLE propriedades_rurais (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    municipio VARCHAR(100),
    estado VARCHAR(2),
    area_hectares DECIMAL(19, 2),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_propriedades_rurais PRIMARY KEY (id),
    CONSTRAINT fk_propriedades_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id)
);

CREATE INDEX idx_propriedades_empresa
    ON propriedades_rurais (empresa_id, ativa);

CREATE TABLE atividades_rurais (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_atividades_rurais PRIMARY KEY (id),
    CONSTRAINT fk_atividades_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT uk_atividades_empresa_nome
        UNIQUE (empresa_id, nome)
);

CREATE INDEX idx_atividades_empresa
    ON atividades_rurais (empresa_id, ativa);

ALTER TABLE movimentacoes
    ADD COLUMN propriedade_rural_id BIGINT NULL,
    ADD COLUMN atividade_rural_id BIGINT NULL,
    ADD CONSTRAINT fk_movimentacoes_propriedade_rural
        FOREIGN KEY (propriedade_rural_id)
            REFERENCES propriedades_rurais (id),
    ADD CONSTRAINT fk_movimentacoes_atividade_rural
        FOREIGN KEY (atividade_rural_id)
            REFERENCES atividades_rurais (id);

CREATE INDEX idx_movimentacoes_propriedade
    ON movimentacoes (empresa_id, propriedade_rural_id);

CREATE INDEX idx_movimentacoes_atividade
    ON movimentacoes (empresa_id, atividade_rural_id);

CREATE TABLE contador_empresa (
    id BIGINT NOT NULL AUTO_INCREMENT,
    contador_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_contador_empresa PRIMARY KEY (id),
    CONSTRAINT fk_contador_empresa_contador
        FOREIGN KEY (contador_id) REFERENCES usuarios (id),
    CONSTRAINT fk_contador_empresa_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT uk_contador_empresa
        UNIQUE (contador_id, empresa_id),
    CONSTRAINT chk_contador_empresa_status
        CHECK (status IN ('ATIVO', 'SUSPENSO', 'ENCERRADO'))
);

CREATE INDEX idx_contador_empresa_contador
    ON contador_empresa (contador_id, status);

CREATE TABLE documentos_agro (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    movimentacao_id BIGINT NULL,
    enviado_por_usuario_id BIGINT NULL,
    nome_arquivo VARCHAR(180) NOT NULL,
    tipo_conteudo VARCHAR(120),
    tamanho_bytes BIGINT NOT NULL DEFAULT 0,
    tipo_documento VARCHAR(40) NOT NULL DEFAULT 'OUTRO',
    status VARCHAR(40) NOT NULL DEFAULT 'ENVIADO',
    observacao VARCHAR(500),
    conteudo LONGBLOB NULL,
    analisado_em TIMESTAMP(6) NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_documentos_agro PRIMARY KEY (id),
    CONSTRAINT fk_documentos_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_documentos_movimentacao
        FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes (id),
    CONSTRAINT fk_documentos_usuario
        FOREIGN KEY (enviado_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_documentos_tipo
        CHECK (tipo_documento IN ('NOTA_FISCAL', 'XML', 'COMPROVANTE', 'RECIBO', 'CONTRATO', 'OUTRO')),
    CONSTRAINT chk_documentos_status
        CHECK (status IN ('ENVIADO', 'VINCULADO', 'AGUARDANDO_ANALISE', 'ANALISADO', 'REJEITADO', 'ARQUIVADO'))
);

CREATE INDEX idx_documentos_empresa
    ON documentos_agro (empresa_id, status, criado_em);

CREATE INDEX idx_documentos_movimentacao
    ON documentos_agro (movimentacao_id);

CREATE TABLE pendencias_agro (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    movimentacao_id BIGINT NULL,
    documento_id BIGINT NULL,
    criada_por_usuario_id BIGINT NULL,
    responsavel_usuario_id BIGINT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ABERTA',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    titulo VARCHAR(160) NOT NULL,
    descricao VARCHAR(1000),
    vencimento DATE NULL,
    resolvida_em TIMESTAMP(6) NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_pendencias_agro PRIMARY KEY (id),
    CONSTRAINT fk_pendencias_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_pendencias_movimentacao
        FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes (id),
    CONSTRAINT fk_pendencias_documento
        FOREIGN KEY (documento_id) REFERENCES documentos_agro (id),
    CONSTRAINT fk_pendencias_criada_por
        FOREIGN KEY (criada_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_pendencias_responsavel
        FOREIGN KEY (responsavel_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT chk_pendencias_tipo
        CHECK (tipo IN ('DOCUMENTO_AUSENTE', 'SEM_CLASSIFICACAO', 'INFORMACAO_INCOMPLETA', 'DOCUMENTO_SOLICITADO', 'ALERTA_TRIBUTARIO', 'OUTRA')),
    CONSTRAINT chk_pendencias_status
        CHECK (status IN ('ABERTA', 'AGUARDANDO_PRODUTOR', 'AGUARDANDO_CONTADOR', 'EM_ANALISE', 'RESOLVIDA', 'CANCELADA')),
    CONSTRAINT chk_pendencias_prioridade
        CHECK (prioridade IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE'))
);

CREATE INDEX idx_pendencias_empresa
    ON pendencias_agro (empresa_id, status, tipo);

CREATE TABLE pendencia_mensagens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    pendencia_id BIGINT NOT NULL,
    usuario_id BIGINT NULL,
    mensagem VARCHAR(1000) NOT NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_pendencia_mensagens PRIMARY KEY (id),
    CONSTRAINT fk_pendencia_mensagens_pendencia
        FOREIGN KEY (pendencia_id) REFERENCES pendencias_agro (id),
    CONSTRAINT fk_pendencia_mensagens_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX idx_pendencia_mensagens_pendencia
    ON pendencia_mensagens (pendencia_id, criado_em);

CREATE TABLE rateios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    movimentacao_id BIGINT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'PERCENTUAL',
    observacao VARCHAR(500),
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_rateios PRIMARY KEY (id),
    CONSTRAINT fk_rateios_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_rateios_movimentacao
        FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes (id),
    CONSTRAINT uk_rateios_movimentacao
        UNIQUE (movimentacao_id),
    CONSTRAINT chk_rateios_tipo
        CHECK (tipo IN ('PERCENTUAL', 'VALOR'))
);

CREATE TABLE rateio_itens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    rateio_id BIGINT NOT NULL,
    propriedade_rural_id BIGINT NULL,
    descricao VARCHAR(150),
    percentual DECIMAL(9, 4),
    valor DECIMAL(19, 2),
    CONSTRAINT pk_rateio_itens PRIMARY KEY (id),
    CONSTRAINT fk_rateio_itens_rateio
        FOREIGN KEY (rateio_id) REFERENCES rateios (id),
    CONSTRAINT fk_rateio_itens_propriedade
        FOREIGN KEY (propriedade_rural_id)
            REFERENCES propriedades_rurais (id)
);

CREATE TABLE auditoria_agro (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    usuario_id BIGINT NULL,
    acao VARCHAR(80) NOT NULL,
    entidade VARCHAR(80) NOT NULL,
    entidade_id BIGINT NULL,
    detalhes VARCHAR(1000),
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_auditoria_agro PRIMARY KEY (id),
    CONSTRAINT fk_auditoria_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX idx_auditoria_empresa
    ON auditoria_agro (empresa_id, criado_em);
