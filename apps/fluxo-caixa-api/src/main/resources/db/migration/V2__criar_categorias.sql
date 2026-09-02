CREATE TABLE categorias (
                            id BIGINT NOT NULL AUTO_INCREMENT,
                            empresa_id BIGINT NOT NULL,
                            nome VARCHAR(100) NOT NULL,
                            tipo VARCHAR(20) NOT NULL,
                            ativo BOOLEAN NOT NULL DEFAULT TRUE,
                            criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                            atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),

                            CONSTRAINT pk_categorias
                                PRIMARY KEY (id),

                            CONSTRAINT fk_categorias_empresa
                                FOREIGN KEY (empresa_id)
                                    REFERENCES empresas (id),

                            CONSTRAINT uk_categorias_empresa_nome_tipo
                                UNIQUE (empresa_id, nome, tipo),

                            CONSTRAINT chk_categorias_tipo
                                CHECK (tipo IN ('RECEITA', 'DESPESA'))
);

CREATE INDEX idx_categorias_empresa
    ON categorias (empresa_id);

CREATE INDEX idx_categorias_empresa_tipo
    ON categorias (empresa_id, tipo);


ALTER TABLE movimentacoes
    ADD COLUMN categoria_id BIGINT NULL AFTER empresa_id;

ALTER TABLE movimentacoes
    ADD CONSTRAINT fk_movimentacoes_categoria
        FOREIGN KEY (categoria_id)
            REFERENCES categorias (id);

CREATE INDEX idx_movimentacoes_categoria
    ON movimentacoes (categoria_id);