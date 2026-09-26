CREATE TABLE assinatura_configuracoes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    preco_mensal DECIMAL(19, 2) NOT NULL,
    trial_habilitado BOOLEAN NOT NULL,
    dias_trial_padrao INT NOT NULL,
    dias_aviso_trial INT NOT NULL,
    dias_carencia INT NOT NULL,
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO assinatura_configuracoes (
    preco_mensal,
    trial_habilitado,
    dias_trial_padrao,
    dias_aviso_trial,
    dias_carencia
) VALUES (
    89.90,
    TRUE,
    15,
    7,
    3
);

CREATE TABLE assinaturas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    valor_mensal DECIMAL(19, 2) NOT NULL,
    trial_inicio DATE NULL,
    trial_fim DATE NULL,
    proximo_vencimento DATE NULL,
    ultimo_pagamento_em DATE NULL,
    asaas_customer_id VARCHAR(80) NULL,
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    versao BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_assinaturas_empresa UNIQUE (empresa_id),
    CONSTRAINT uk_assinaturas_asaas_customer UNIQUE (asaas_customer_id),
    CONSTRAINT fk_assinaturas_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assinatura_pagamentos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    assinatura_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    movimentacao_id BIGINT NULL,
    asaas_payment_id VARCHAR(80) NOT NULL,
    external_reference VARCHAR(120) NOT NULL,
    descricao VARCHAR(180) NOT NULL,
    forma_pagamento VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    valor DECIMAL(19, 2) NOT NULL,
    vencimento DATE NOT NULL,
    pago_em DATE NULL,
    invoice_url VARCHAR(500) NULL,
    boleto_url VARCHAR(500) NULL,
    linha_digitavel VARCHAR(120) NULL,
    pix_qr_code_base64 LONGTEXT NULL,
    pix_copia_cola LONGTEXT NULL,
    pix_expira_em DATETIME(6) NULL,
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    versao BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_assinatura_pagamentos_asaas_payment UNIQUE (asaas_payment_id),
    CONSTRAINT uk_assinatura_pagamentos_external_reference UNIQUE (external_reference),
    CONSTRAINT uk_assinatura_pagamentos_movimentacao UNIQUE (movimentacao_id),
    CONSTRAINT fk_assinatura_pagamentos_assinatura
        FOREIGN KEY (assinatura_id)
        REFERENCES assinaturas (id),
    CONSTRAINT fk_assinatura_pagamentos_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas (id),
    CONSTRAINT fk_assinatura_pagamentos_movimentacao
        FOREIGN KEY (movimentacao_id)
        REFERENCES movimentacoes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE asaas_webhook_eventos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    chave_evento VARCHAR(160) NOT NULL,
    evento VARCHAR(80) NOT NULL,
    asaas_payment_id VARCHAR(80) NULL,
    status_processamento VARCHAR(30) NOT NULL,
    payload LONGTEXT NULL,
    erro VARCHAR(500) NULL,
    recebido_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    processado_em DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_asaas_webhook_eventos_chave UNIQUE (chave_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO assinaturas (
    empresa_id,
    status,
    valor_mensal,
    trial_inicio,
    trial_fim,
    proximo_vencimento
)
SELECT
    e.id,
    'ACTIVE',
    89.90,
    NULL,
    NULL,
    NULL
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1
    FROM assinaturas a
    WHERE a.empresa_id = e.id
);
