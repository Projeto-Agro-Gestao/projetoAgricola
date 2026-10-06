CREATE TABLE refresh_tokens (
                                id BIGINT NOT NULL AUTO_INCREMENT,
                                usuario_id BIGINT NOT NULL,
                                token_hash VARCHAR(64) NOT NULL,
                                data_criacao TIMESTAMP(6) NOT NULL
                                    DEFAULT CURRENT_TIMESTAMP(6),
                                data_expiracao TIMESTAMP(6) NOT NULL,
                                revogado_em TIMESTAMP(6) NULL,
                                substituido_por_id BIGINT NULL,

                                CONSTRAINT pk_refresh_tokens
                                    PRIMARY KEY (id),

                                CONSTRAINT fk_refresh_tokens_usuario
                                    FOREIGN KEY (usuario_id)
                                        REFERENCES usuarios (id)
                                        ON DELETE CASCADE,

                                CONSTRAINT fk_refresh_tokens_substituto
                                    FOREIGN KEY (substituido_por_id)
                                        REFERENCES refresh_tokens (id),

                                CONSTRAINT uk_refresh_tokens_token_hash
                                    UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_usuario
    ON refresh_tokens (usuario_id);

CREATE INDEX idx_refresh_tokens_data_expiracao
    ON refresh_tokens (data_expiracao);
