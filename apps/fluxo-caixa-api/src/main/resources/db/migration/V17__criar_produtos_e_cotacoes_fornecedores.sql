CREATE TABLE categorias_produto (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME(6) NOT NULL,
    atualizado_em DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_categorias_produto_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT uk_categorias_produto_empresa_nome
        UNIQUE (empresa_id, nome)
);

CREATE TABLE produtos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    categoria_produto_id BIGINT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    unidade_base VARCHAR(30) NOT NULL,
    peso_padrao_kg DECIMAL(19, 3),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME(6) NOT NULL,
    atualizado_em DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_produtos_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_produtos_categoria_produto
        FOREIGN KEY (categoria_produto_id) REFERENCES categorias_produto (id),
    CONSTRAINT uk_produtos_empresa_categoria_nome
        UNIQUE (empresa_id, categoria_produto_id, nome)
);

CREATE TABLE fornecedor_cotacoes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    fornecedor_id BIGINT NOT NULL,
    produto_id BIGINT NOT NULL,
    comprador_nome VARCHAR(150),
    data_cotacao DATE NOT NULL,
    quantidade DECIMAL(19, 3) NOT NULL,
    unidade_medida VARCHAR(30) NOT NULL,
    peso_total_kg DECIMAL(19, 3),
    valor_total DECIMAL(19, 2) NOT NULL,
    valor_por_kg DECIMAL(19, 4),
    valor_por_unidade DECIMAL(19, 4),
    valor_por_lote DECIMAL(19, 2),
    frete DECIMAL(19, 2),
    desconto DECIMAL(19, 2),
    observacao VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    movimentacao_id BIGINT,
    conta_financeira_id BIGINT,
    criado_em DATETIME(6) NOT NULL,
    atualizado_em DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_fornecedor_cotacoes_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_fornecedor_cotacoes_fornecedor
        FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id),
    CONSTRAINT fk_fornecedor_cotacoes_produto
        FOREIGN KEY (produto_id) REFERENCES produtos (id),
    CONSTRAINT fk_fornecedor_cotacoes_movimentacao
        FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes (id),
    CONSTRAINT fk_fornecedor_cotacoes_conta
        FOREIGN KEY (conta_financeira_id) REFERENCES contas_financeiras (id)
);

ALTER TABLE movimentacoes
    ADD COLUMN produto_id BIGINT NULL,
    ADD CONSTRAINT fk_movimentacoes_produto
        FOREIGN KEY (produto_id) REFERENCES produtos (id);

ALTER TABLE contas_financeiras
    ADD COLUMN produto_id BIGINT NULL,
    ADD CONSTRAINT fk_contas_financeiras_produto
        FOREIGN KEY (produto_id) REFERENCES produtos (id);
