ALTER TABLE usuarios
    ADD COLUMN tipo_acesso VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN acesso_expira_em DATE NULL;
