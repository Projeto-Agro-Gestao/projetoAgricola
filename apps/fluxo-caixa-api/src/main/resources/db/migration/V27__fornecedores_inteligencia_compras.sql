ALTER TABLE fornecedores
    ADD COLUMN nome_fantasia VARCHAR(150) NULL,
    ADD COLUMN razao_social VARCHAR(180) NULL,
    ADD COLUMN tipo_pessoa VARCHAR(20) NULL,
    ADD COLUMN documento VARCHAR(20) NULL,
    ADD COLUMN telefone_whatsapp VARCHAR(30) NULL,
    ADD COLUMN email VARCHAR(150) NULL,
    ADD COLUMN contato_comercial VARCHAR(150) NULL,
    ADD COLUMN site VARCHAR(180) NULL,
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN cep VARCHAR(12) NULL,
    ADD COLUMN logradouro VARCHAR(180) NULL,
    ADD COLUMN numero VARCHAR(30) NULL,
    ADD COLUMN complemento VARCHAR(100) NULL,
    ADD COLUMN bairro VARCHAR(100) NULL,
    ADD COLUMN municipio VARCHAR(100) NULL,
    ADD COLUMN uf VARCHAR(2) NULL,
    ADD COLUMN pais VARCHAR(60) NULL,
    ADD COLUMN prazo_medio_entrega_dias INT NULL,
    ADD COLUMN formas_pagamento VARCHAR(250) NULL,
    ADD COLUMN prazo_pagamento VARCHAR(100) NULL,
    ADD COLUMN condicao_frete VARCHAR(150) NULL,
    ADD COLUMN valor_minimo_pedido DECIMAL(19, 2) NULL,
    ADD COLUMN observacoes_comerciais VARCHAR(500) NULL;

UPDATE fornecedores
SET nome_fantasia = nome,
    ativo = CASE WHEN excluido = b'1' THEN FALSE ELSE TRUE END,
    pais = 'Brasil'
WHERE nome_fantasia IS NULL;

CREATE INDEX idx_fornecedores_empresa_documento
    ON fornecedores (empresa_id, documento);

CREATE INDEX idx_fornecedores_empresa_ativo
    ON fornecedores (empresa_id, ativo, excluido);

CREATE INDEX idx_fornecedor_cotacoes_empresa_produto_data
    ON fornecedor_cotacoes (empresa_id, produto_id, data_cotacao);
