CREATE TABLE fornecedores (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30) NULL,
    observacao VARCHAR(500) NULL,
    excluido BIT(1) NOT NULL DEFAULT b'0',
    excluido_em DATETIME(6) NULL,
    versao BIGINT NOT NULL DEFAULT 0,
    criado_em DATETIME(6) NOT NULL,
    atualizado_em DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_fornecedores_empresas
        FOREIGN KEY (empresa_id)
        REFERENCES empresas (id)
);

CREATE INDEX idx_fornecedores_empresa_nome
    ON fornecedores (empresa_id, nome);

CREATE INDEX idx_fornecedores_empresa_lixeira
    ON fornecedores (empresa_id, excluido, excluido_em);

ALTER TABLE movimentacoes
    ADD COLUMN fornecedor_id BIGINT NULL,
    ADD COLUMN fornecedor_nome VARCHAR(150) NULL,
    ADD COLUMN comprador_nome VARCHAR(150) NULL,
    ADD CONSTRAINT fk_movimentacoes_fornecedores
        FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores (id);

CREATE INDEX idx_movimentacoes_fornecedor
    ON movimentacoes (empresa_id, fornecedor_id);

ALTER TABLE contas_financeiras
    ADD COLUMN fornecedor_id BIGINT NULL,
    ADD COLUMN fornecedor_nome VARCHAR(150) NULL,
    ADD COLUMN comprador_nome VARCHAR(150) NULL,
    ADD CONSTRAINT fk_contas_financeiras_fornecedores
        FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores (id);

CREATE INDEX idx_contas_financeiras_fornecedor
    ON contas_financeiras (empresa_id, fornecedor_id);
