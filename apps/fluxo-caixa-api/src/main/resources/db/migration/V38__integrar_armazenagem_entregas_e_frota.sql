CREATE TABLE lancamentos_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, safra_id BIGINT NOT NULL,
 movimentacao_id BIGINT NOT NULL UNIQUE, origem VARCHAR(30) NOT NULL,
 FOREIGN KEY (empresa_id) REFERENCES empresas(id), FOREIGN KEY (safra_id) REFERENCES safras_agro(id),
 FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id)
);
INSERT INTO lancamentos_agro(empresa_id,safra_id,movimentacao_id,origem)
 SELECT empresa_id,safra_id,movimentacao_id,'OPERACAO' FROM operacoes_agro WHERE movimentacao_id IS NOT NULL;
CREATE TABLE armazens_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, propriedade_id BIGINT NOT NULL,
 nome VARCHAR(120) NOT NULL, capacidade_kg DECIMAL(19,3) NOT NULL,
 UNIQUE(empresa_id,propriedade_id,nome), CHECK(capacidade_kg>0),
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(propriedade_id) REFERENCES propriedades_rurais(id)
);
CREATE TABLE entregas_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, contrato_id BIGINT NOT NULL,
 armazem_id BIGINT NOT NULL, chave VARCHAR(64) NOT NULL, data_entrega DATE NOT NULL,
 quantidade_kg DECIMAL(19,3) NOT NULL, valor DECIMAL(19,2) NOT NULL, comissao DECIMAL(19,2) NOT NULL,
 receita_id BIGINT NULL UNIQUE, comissao_id BIGINT NULL UNIQUE,
 UNIQUE(empresa_id,chave), CHECK(quantidade_kg>0),
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(contrato_id) REFERENCES contratos_agro(id),
 FOREIGN KEY(armazem_id) REFERENCES armazens_agro(id), FOREIGN KEY(receita_id) REFERENCES movimentacoes(id),
 FOREIGN KEY(comissao_id) REFERENCES movimentacoes(id)
);
CREATE TABLE graos_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, armazem_id BIGINT NOT NULL,
 safra_id BIGINT NOT NULL, operacao_id BIGINT NULL, entrega_id BIGINT NULL UNIQUE,
 quantidade_kg DECIMAL(19,3) NOT NULL, chave VARCHAR(64) NOT NULL, data_registro DATE NOT NULL,
 UNIQUE(empresa_id,chave), CHECK(quantidade_kg<>0),
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(armazem_id) REFERENCES armazens_agro(id),
 FOREIGN KEY(safra_id) REFERENCES safras_agro(id), FOREIGN KEY(operacao_id) REFERENCES operacoes_agro(id),
 FOREIGN KEY(entrega_id) REFERENCES entregas_agro(id)
);
CREATE TABLE maquinas_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, propriedade_id BIGINT NOT NULL,
 nome VARCHAR(120) NOT NULL, identificacao VARCHAR(80) NOT NULL, horimetro DECIMAL(19,2) NOT NULL DEFAULT 0,
 proxima_manutencao DECIMAL(19,2) NULL, UNIQUE(empresa_id,identificacao), CHECK(horimetro>=0),
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(propriedade_id) REFERENCES propriedades_rurais(id)
);
CREATE TABLE usos_maquinas_agro (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, empresa_id BIGINT NOT NULL, maquina_id BIGINT NOT NULL,
 operacao_id BIGINT NOT NULL, chave VARCHAR(64) NOT NULL, tipo VARCHAR(20) NOT NULL,
 horas DECIMAL(19,2) NOT NULL, combustivel_litros DECIMAL(19,3) NOT NULL,
 movimentacao_id BIGINT NULL UNIQUE, observacao VARCHAR(300) NOT NULL,
 UNIQUE(empresa_id,chave), CHECK(horas>=0), CHECK(combustivel_litros>=0),
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(maquina_id) REFERENCES maquinas_agro(id),
 FOREIGN KEY(operacao_id) REFERENCES operacoes_agro(id), FOREIGN KEY(movimentacao_id) REFERENCES movimentacoes(id)
);
