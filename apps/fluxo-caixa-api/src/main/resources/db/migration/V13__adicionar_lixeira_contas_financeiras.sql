ALTER TABLE contas_financeiras
    ADD COLUMN excluida BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN excluida_em DATETIME NULL,
    ADD COLUMN categoria_original_nome VARCHAR(100) NULL,
    ADD COLUMN movimentacao_financeiro_id BIGINT NULL;

CREATE INDEX idx_contas_financeiras_lixeira
    ON contas_financeiras (
                           empresa_id,
                           excluida,
                           excluida_em
        );

ALTER TABLE contas_financeiras
    ADD CONSTRAINT fk_contas_financeiras_movimentacao_financeiro
        FOREIGN KEY (movimentacao_financeiro_id)
            REFERENCES movimentacoes (id);
