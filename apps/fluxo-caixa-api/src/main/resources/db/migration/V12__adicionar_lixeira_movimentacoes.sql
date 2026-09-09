ALTER TABLE movimentacoes
    ADD COLUMN excluida BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN excluida_em DATETIME NULL,
    ADD COLUMN categoria_original_nome VARCHAR(100) NULL;

ALTER TABLE movimentacoes
    MODIFY COLUMN categoria_id BIGINT NULL;

CREATE INDEX idx_movimentacoes_lixeira
    ON movimentacoes (
                      empresa_id,
                      excluida,
                      excluida_em
        );
