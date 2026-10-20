ALTER TABLE propriedades_rurais ADD COLUMN latitude DECIMAL(7,4) NULL;
ALTER TABLE propriedades_rurais ADD COLUMN longitude DECIMAL(7,4) NULL;
ALTER TABLE propriedades_rurais ADD CONSTRAINT chk_propriedades_latitude CHECK (latitude BETWEEN -90 AND 90);
ALTER TABLE propriedades_rurais ADD CONSTRAINT chk_propriedades_longitude CHECK (longitude BETWEEN -180 AND 180);
CREATE TABLE cotacoes_agricolas (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 empresa_id BIGINT NOT NULL,
 cultura VARCHAR(80) NOT NULL,
 praca VARCHAR(100) NOT NULL,
 unidade VARCHAR(30) NOT NULL,
 valor DECIMAL(19,4) NOT NULL,
 data_cotacao DATE NOT NULL,
 fonte VARCHAR(300) NOT NULL,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (empresa_id) REFERENCES empresas(id),
 UNIQUE (empresa_id,cultura,praca,unidade,data_cotacao,fonte),
 CHECK (valor > 0)
);
