CREATE TABLE agro_acessos_usuario (
 empresa_id BIGINT NOT NULL, usuario_id BIGINT NOT NULL, restringir_propriedades BOOLEAN NOT NULL DEFAULT false,
 PRIMARY KEY(empresa_id,usuario_id), FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE agro_acessos_funcao (
 empresa_id BIGINT NOT NULL, usuario_id BIGINT NOT NULL, funcionalidade VARCHAR(30) NOT NULL,
 pode_ler BOOLEAN NOT NULL, pode_escrever BOOLEAN NOT NULL,
 PRIMARY KEY(empresa_id,usuario_id,funcionalidade), FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE agro_acessos_propriedade (
 empresa_id BIGINT NOT NULL, usuario_id BIGINT NOT NULL, propriedade_id BIGINT NOT NULL, permitido BOOLEAN NOT NULL,
 PRIMARY KEY(empresa_id,usuario_id,propriedade_id), FOREIGN KEY(empresa_id) REFERENCES empresas(id),
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id), FOREIGN KEY(propriedade_id) REFERENCES propriedades_rurais(id)
);
ALTER TABLE romaneios_agro ADD COLUMN propriedade_id BIGINT NULL;
ALTER TABLE romaneios_agro ADD CONSTRAINT fk_romaneio_propriedade FOREIGN KEY(propriedade_id) REFERENCES propriedades_rurais(id);
