ALTER TABLE usuarios
    ADD COLUMN acesso_liberado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN status_pagamento VARCHAR(30) NOT NULL DEFAULT 'EM_DIA',
    ADD COLUMN data_vencimento_pagamento DATE NULL,
    ADD COLUMN ultimo_uso_em TIMESTAMP(6) NULL;

CREATE TABLE usuario_acessos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT NOT NULL,
    data_uso DATE NOT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em TIMESTAMP(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_usuario_acessos
        PRIMARY KEY (id),

    CONSTRAINT fk_usuario_acessos_usuario
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios (id),

    CONSTRAINT uk_usuario_acessos_usuario_data
        UNIQUE (usuario_id, data_uso),

    CONSTRAINT chk_usuario_acessos_quantidade
        CHECK (quantidade >= 0)
);

CREATE INDEX idx_usuario_acessos_data
    ON usuario_acessos (data_uso);
