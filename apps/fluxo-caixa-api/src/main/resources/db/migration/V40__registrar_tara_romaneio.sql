ALTER TABLE operacoes_agro ADD COLUMN tara_kg DECIMAL(19,3) NOT NULL DEFAULT 0;
ALTER TABLE operacoes_agro ADD CONSTRAINT chk_operacoes_tara CHECK (tara_kg>=0 AND tara_kg<=quantidade_kg);
