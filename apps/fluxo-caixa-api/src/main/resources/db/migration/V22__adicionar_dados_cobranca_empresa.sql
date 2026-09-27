ALTER TABLE empresas
    ADD COLUMN cep_cobranca VARCHAR(12) NULL,
    ADD COLUMN rua_cobranca VARCHAR(150) NULL,
    ADD COLUMN numero_cobranca VARCHAR(20) NULL,
    ADD COLUMN bairro_cobranca VARCHAR(100) NULL,
    ADD COLUMN cidade_cobranca VARCHAR(100) NULL,
    ADD COLUMN estado_cobranca VARCHAR(2) NULL;
