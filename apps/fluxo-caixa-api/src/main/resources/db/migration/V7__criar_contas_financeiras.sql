CREATE TABLE contas_financeiras (
                                    id BIGINT NOT NULL AUTO_INCREMENT,
                                    empresa_id BIGINT NOT NULL,
                                    categoria_id BIGINT NOT NULL,

                                    descricao VARCHAR(150) NOT NULL,
                                    favorecido VARCHAR(150),
                                    numero_documento VARCHAR(80),

                                    tipo VARCHAR(20) NOT NULL,
                                    valor_total DECIMAL(19, 2) NOT NULL,
                                    valor_liquidado DECIMAL(19, 2) NOT NULL DEFAULT 0.00,

                                    data_emissao DATE NOT NULL,
                                    data_vencimento DATE NOT NULL,
                                    data_liquidacao DATE NULL,

                                    situacao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

                                    lembrete_ativo BOOLEAN NOT NULL DEFAULT TRUE,
                                    antecedencia_lembrete_dias INT NOT NULL DEFAULT 2,

                                    observacao VARCHAR(500),

                                    versao BIGINT NOT NULL DEFAULT 0,

                                    criado_em TIMESTAMP(6) NOT NULL
                                                                            DEFAULT CURRENT_TIMESTAMP(6),

                                    atualizado_em TIMESTAMP(6) NOT NULL
                                                                            DEFAULT CURRENT_TIMESTAMP(6)
                                        ON UPDATE CURRENT_TIMESTAMP(6),

                                    CONSTRAINT pk_contas_financeiras
                                        PRIMARY KEY (id),

                                    CONSTRAINT fk_contas_financeiras_empresa
                                        FOREIGN KEY (empresa_id)
                                            REFERENCES empresas (id),

                                    CONSTRAINT fk_contas_financeiras_categoria
                                        FOREIGN KEY (categoria_id)
                                            REFERENCES categorias (id),

                                    CONSTRAINT chk_contas_financeiras_tipo
                                        CHECK (
                                            tipo IN (
                                                     'PAGAR',
                                                     'RECEBER'
                                                )
                                            ),

                                    CONSTRAINT chk_contas_financeiras_situacao
                                        CHECK (
                                            situacao IN (
                                                         'PENDENTE',
                                                         'PARCIAL',
                                                         'QUITADA',
                                                         'CANCELADA'
                                                )
                                            ),

                                    CONSTRAINT chk_contas_financeiras_valor_total
                                        CHECK (
                                            valor_total > 0
                                            ),

                                    CONSTRAINT chk_contas_financeiras_valor_liquidado
                                        CHECK (
                                            valor_liquidado >= 0
                                                AND valor_liquidado <= valor_total
                                            ),

                                    CONSTRAINT chk_contas_financeiras_lembrete
                                        CHECK (
                                            antecedencia_lembrete_dias
                                                BETWEEN 0 AND 365
                                            )
);


CREATE INDEX idx_contas_financeiras_empresa
    ON contas_financeiras (
                           empresa_id
        );


CREATE INDEX idx_contas_empresa_tipo_vencimento
    ON contas_financeiras (
                           empresa_id,
                           tipo,
                           data_vencimento
        );


CREATE INDEX idx_contas_empresa_situacao_vencimento
    ON contas_financeiras (
                           empresa_id,
                           situacao,
                           data_vencimento
        );


CREATE INDEX idx_contas_empresa_lembrete_vencimento
    ON contas_financeiras (
                           empresa_id,
                           lembrete_ativo,
                           situacao,
                           data_vencimento
        );


CREATE INDEX idx_contas_financeiras_categoria
    ON contas_financeiras (
                           categoria_id
        );


CREATE TABLE liquidacoes_contas (
                                    id BIGINT NOT NULL AUTO_INCREMENT,
                                    conta_financeira_id BIGINT NOT NULL,
                                    movimentacao_id BIGINT NOT NULL,

                                    valor DECIMAL(19, 2) NOT NULL,
                                    data_liquidacao DATE NOT NULL,
                                    observacao VARCHAR(500),

                                    criado_em TIMESTAMP(6) NOT NULL
                                        DEFAULT CURRENT_TIMESTAMP(6),

                                    CONSTRAINT pk_liquidacoes_contas
                                        PRIMARY KEY (id),

                                    CONSTRAINT fk_liquidacoes_conta
                                        FOREIGN KEY (conta_financeira_id)
                                            REFERENCES contas_financeiras (id),

                                    CONSTRAINT fk_liquidacoes_movimentacao
                                        FOREIGN KEY (movimentacao_id)
                                            REFERENCES movimentacoes (id),

                                    CONSTRAINT uk_liquidacoes_movimentacao
                                        UNIQUE (movimentacao_id),

                                    CONSTRAINT chk_liquidacoes_contas_valor
                                        CHECK (
                                            valor > 0
                                            )
);


CREATE INDEX idx_liquidacoes_conta
    ON liquidacoes_contas (
                           conta_financeira_id
        );


CREATE INDEX idx_liquidacoes_data
    ON liquidacoes_contas (
                           data_liquidacao
        );