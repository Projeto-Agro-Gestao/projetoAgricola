CREATE TABLE insumos_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL,
 nome VARCHAR(120) NOT NULL, tipo VARCHAR(30) NOT NULL, unidade VARCHAR(20) NOT NULL,
 saldo DECIMAL(19,4) NOT NULL DEFAULT 0,
 UNIQUE (empresa_id,nome,unidade), FOREIGN KEY (empresa_id) REFERENCES empresas(id), CHECK (saldo >= 0)
);
CREATE TABLE estoque_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, insumo_id BIGINT NOT NULL,
 operacao_id BIGINT NULL, chave VARCHAR(64) NOT NULL, tipo VARCHAR(10) NOT NULL,
 quantidade DECIMAL(19,4) NOT NULL, data_registro DATE NOT NULL, observacao VARCHAR(300) NOT NULL,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (empresa_id,chave), FOREIGN KEY (empresa_id) REFERENCES empresas(id),
 FOREIGN KEY (insumo_id) REFERENCES insumos_agro(id), FOREIGN KEY (operacao_id) REFERENCES operacoes_agro(id),
 CHECK (quantidade > 0), CHECK (tipo IN ('ENTRADA','SAIDA'))
);
CREATE TABLE contratos_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, safra_id BIGINT NOT NULL,
 numero VARCHAR(80) NOT NULL, contraparte VARCHAR(150) NOT NULL, quantidade_kg DECIMAL(19,3) NOT NULL,
 preco_kg DECIMAL(19,4) NOT NULL, comissao_percentual DECIMAL(7,4) NOT NULL DEFAULT 0,
 vencimento DATE NOT NULL, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (empresa_id,numero), FOREIGN KEY (empresa_id) REFERENCES empresas(id),
 FOREIGN KEY (safra_id) REFERENCES safras_agro(id),
 CHECK (quantidade_kg > 0), CHECK (preco_kg > 0), CHECK (comissao_percentual BETWEEN 0 AND 100)
);
CREATE TABLE extrato_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, conta VARCHAR(100) NOT NULL,
 referencia VARCHAR(100) NOT NULL, descricao VARCHAR(150) NOT NULL, data_registro DATE NOT NULL,
 valor DECIMAL(19,2) NOT NULL, movimentacao_id BIGINT NULL, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (empresa_id,conta,referencia), UNIQUE (movimentacao_id),
 FOREIGN KEY (empresa_id) REFERENCES empresas(id), FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id),
 CHECK (valor <> 0)
);
