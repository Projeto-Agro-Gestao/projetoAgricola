ALTER TABLE empresas
    ADD COLUMN inscricao_estadual VARCHAR(40) NULL,
    ADD COLUMN isento_inscricao_estadual BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN inscricao_municipal VARCHAR(40) NULL,
    ADD COLUMN isento_inscricao_municipal BOOLEAN NOT NULL DEFAULT FALSE;
