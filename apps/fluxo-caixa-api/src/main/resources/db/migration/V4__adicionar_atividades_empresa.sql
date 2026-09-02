ALTER TABLE empresas
    ADD COLUMN agricultura_ativa BOOLEAN NOT NULL DEFAULT TRUE
    AFTER ativo;

ALTER TABLE empresas
    ADD COLUMN pecuaria_ativa BOOLEAN NOT NULL DEFAULT FALSE
    AFTER agricultura_ativa;