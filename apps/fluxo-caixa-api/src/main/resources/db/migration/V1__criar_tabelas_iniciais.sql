CREATE TABLE empresas (
                          id BIGINT NOT NULL AUTO_INCREMENT,
                          nome VARCHAR(150) NOT NULL,
                          documento VARCHAR(20),
                          ativo BOOLEAN NOT NULL DEFAULT TRUE,
                          criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                          atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                              ON UPDATE CURRENT_TIMESTAMP(6),

                          CONSTRAINT pk_empresas PRIMARY KEY (id),
                          CONSTRAINT uk_empresas_documento UNIQUE (documento)
);

CREATE TABLE movimentacoes (
                               id BIGINT NOT NULL AUTO_INCREMENT,
                               empresa_id BIGINT NOT NULL,
                               descricao VARCHAR(150) NOT NULL,
                               valor DECIMAL(19, 2) NOT NULL,
                               tipo VARCHAR(20) NOT NULL,
                               data_movimentacao DATE NOT NULL,
                               observacao VARCHAR(500),
                               versao BIGINT NOT NULL DEFAULT 0,
                               criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                               atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                   ON UPDATE CURRENT_TIMESTAMP(6),

                               CONSTRAINT pk_movimentacoes PRIMARY KEY (id),

                               CONSTRAINT fk_movimentacoes_empresa
                                   FOREIGN KEY (empresa_id)
                                       REFERENCES empresas (id),

                               CONSTRAINT chk_movimentacoes_valor
                                   CHECK (valor > 0),

                               CONSTRAINT chk_movimentacoes_tipo
                                   CHECK (tipo IN ('RECEITA', 'DESPESA'))
);

CREATE INDEX idx_movimentacoes_empresa_data
    ON movimentacoes (empresa_id, data_movimentacao);

CREATE INDEX idx_movimentacoes_empresa_tipo
    ON movimentacoes (empresa_id, tipo);