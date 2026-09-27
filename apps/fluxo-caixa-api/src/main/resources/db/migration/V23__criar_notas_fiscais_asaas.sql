ALTER TABLE assinatura_configuracoes
    ADD COLUMN nfse_habilitada BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN nfse_emissao_automatica BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN nfse_municipal_service_id VARCHAR(80) NULL,
    ADD COLUMN nfse_municipal_service_code VARCHAR(40) NULL,
    ADD COLUMN nfse_municipal_service_name VARCHAR(180) NULL,
    ADD COLUMN nfse_service_description_template VARCHAR(500) NOT NULL DEFAULT 'Licenca de uso do software AgroGestao referente a competencia {MM/AAAA}.',
    ADD COLUMN nfse_default_observations VARCHAR(500) NOT NULL DEFAULT 'Mensalidade do AgroGestao.',
    ADD COLUMN nfse_iss DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN nfse_cofins DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN nfse_csll DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN nfse_inss DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN nfse_ir DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN nfse_pis DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN nfse_retain_iss BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE notas_fiscais_asaas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    assinatura_pagamento_id BIGINT NOT NULL,
    asaas_payment_id VARCHAR(80) NOT NULL,
    asaas_invoice_id VARCHAR(80) NULL,
    status VARCHAR(40) NOT NULL,
    valor DECIMAL(19,2) NOT NULL,
    data_emissao_prevista DATE NULL,
    data_autorizacao DATE NULL,
    numero_nota VARCHAR(80) NULL,
    codigo_validacao VARCHAR(120) NULL,
    pdf_url VARCHAR(700) NULL,
    xml_url VARCHAR(700) NULL,
    descricao_servico VARCHAR(500) NOT NULL,
    codigo_servico_municipal VARCHAR(80) NULL,
    mensagem_erro VARCHAR(700) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_notas_fiscais_pagamento UNIQUE (assinatura_pagamento_id),
    CONSTRAINT uk_notas_fiscais_asaas_invoice UNIQUE (asaas_invoice_id),
    CONSTRAINT fk_notas_fiscais_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_notas_fiscais_pagamento
        FOREIGN KEY (assinatura_pagamento_id) REFERENCES assinatura_pagamentos (id)
);

CREATE INDEX idx_notas_fiscais_empresa_status
    ON notas_fiscais_asaas (empresa_id, status);

CREATE INDEX idx_notas_fiscais_asaas_payment
    ON notas_fiscais_asaas (asaas_payment_id);
