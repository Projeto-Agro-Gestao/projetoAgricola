CREATE TABLE recuperacao_senha (
                                   id BIGINT NOT NULL AUTO_INCREMENT,
                                   usuario_id BIGINT NOT NULL,
                                   token_hash VARCHAR(64) NOT NULL,
                                   expira_em TIMESTAMP(6) NOT NULL,
                                   utilizado_em TIMESTAMP(6) NULL,
                                   criado_em TIMESTAMP(6) NOT NULL
                                       DEFAULT CURRENT_TIMESTAMP(6),

                                   CONSTRAINT pk_recuperacao_senha
                                       PRIMARY KEY (id),

                                   CONSTRAINT fk_recuperacao_senha_usuario
                                       FOREIGN KEY (usuario_id)
                                           REFERENCES usuarios (id)
                                           ON DELETE CASCADE,

                                   CONSTRAINT uk_recuperacao_senha_token_hash
                                       UNIQUE (token_hash)
);

CREATE INDEX idx_recuperacao_senha_usuario
    ON recuperacao_senha (usuario_id);

CREATE INDEX idx_recuperacao_senha_expira_em
    ON recuperacao_senha (expira_em);