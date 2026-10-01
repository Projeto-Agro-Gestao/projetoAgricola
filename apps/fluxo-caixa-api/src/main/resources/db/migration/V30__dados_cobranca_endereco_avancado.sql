ALTER TABLE empresas
    ADD COLUMN sem_numero_cobranca BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN complemento_cobranca VARCHAR(50) NULL,
    ADD COLUMN observacoes_endereco_cobranca VARCHAR(500) NULL;
