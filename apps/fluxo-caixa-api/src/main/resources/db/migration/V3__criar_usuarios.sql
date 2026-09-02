CREATE TABLE usuarios (
                          id BIGINT NOT NULL AUTO_INCREMENT,
                          empresa_id BIGINT NOT NULL,
                          nome VARCHAR(120) NOT NULL,
                          email VARCHAR(150) NOT NULL,
                          telefone VARCHAR(20),
                          senha_hash VARCHAR(255) NOT NULL,
                          papel VARCHAR(30) NOT NULL DEFAULT 'PROPRIETARIO',
                          ativo BOOLEAN NOT NULL DEFAULT TRUE,
                          email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
                          tentativas_login INT NOT NULL DEFAULT 0,
                          bloqueado_ate TIMESTAMP(6) NULL,
                          ultimo_login_em TIMESTAMP(6) NULL,
                          versao BIGINT NOT NULL DEFAULT 0,
                          criado_em TIMESTAMP(6) NOT NULL
                              DEFAULT CURRENT_TIMESTAMP(6),
                          atualizado_em TIMESTAMP(6) NOT NULL
                              DEFAULT CURRENT_TIMESTAMP(6)
                              ON UPDATE CURRENT_TIMESTAMP(6),

                          CONSTRAINT pk_usuarios
                              PRIMARY KEY (id),

                          CONSTRAINT fk_usuarios_empresa
                              FOREIGN KEY (empresa_id)
                                  REFERENCES empresas (id),

                          CONSTRAINT uk_usuarios_email
                              UNIQUE (email),

                          CONSTRAINT chk_usuarios_papel
                              CHECK (
                                  papel IN (
                                            'PROPRIETARIO',
                                            'ADMINISTRADOR',
                                            'FUNCIONARIO'
                                      )
                                  ),

                          CONSTRAINT chk_usuarios_tentativas_login
                              CHECK (tentativas_login >= 0)
);

CREATE INDEX idx_usuarios_empresa
    ON usuarios (empresa_id);

CREATE INDEX idx_usuarios_empresa_ativo
    ON usuarios (empresa_id, ativo);