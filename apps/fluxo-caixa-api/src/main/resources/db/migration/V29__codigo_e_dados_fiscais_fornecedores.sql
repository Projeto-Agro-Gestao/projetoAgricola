ALTER TABLE fornecedores
    ADD COLUMN codigo_cadastro BIGINT NULL,
    ADD COLUMN inscricao_municipal VARCHAR(40) NULL,
    ADD COLUMN inscricao_estadual VARCHAR(40) NULL,
    ADD COLUMN regime_tributario VARCHAR(80) NULL;

UPDATE fornecedores f
JOIN (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY empresa_id
               ORDER BY criado_em, id
           ) AS codigo
    FROM fornecedores
) sequencia ON sequencia.id = f.id
SET f.codigo_cadastro = sequencia.codigo
WHERE f.codigo_cadastro IS NULL;

ALTER TABLE fornecedores
    MODIFY codigo_cadastro BIGINT NOT NULL;

CREATE UNIQUE INDEX uk_fornecedores_empresa_codigo_cadastro
    ON fornecedores (empresa_id, codigo_cadastro);

CREATE UNIQUE INDEX uk_fornecedores_empresa_documento
    ON fornecedores (empresa_id, documento);
