ALTER TABLE movimentacoes
    ADD COLUMN produto_nome VARCHAR(150) NULL,
    ADD COLUMN produto_classificacao VARCHAR(100) NULL,
    ADD COLUMN quantidade DECIMAL(19, 3) NULL,
    ADD COLUMN unidade_medida VARCHAR(30) NULL,
    ADD COLUMN valor_unitario DECIMAL(19, 4) NULL;

ALTER TABLE contas_financeiras
    ADD COLUMN produto_nome VARCHAR(150) NULL,
    ADD COLUMN produto_classificacao VARCHAR(100) NULL,
    ADD COLUMN quantidade DECIMAL(19, 3) NULL,
    ADD COLUMN unidade_medida VARCHAR(30) NULL,
    ADD COLUMN valor_unitario DECIMAL(19, 4) NULL;
