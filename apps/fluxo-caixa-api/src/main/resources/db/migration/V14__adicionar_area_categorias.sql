ALTER TABLE categorias
    ADD COLUMN area VARCHAR(20) NOT NULL DEFAULT 'GERAL'
        AFTER tipo;

UPDATE categorias
SET area = 'AGRICULTURA'
WHERE LOWER(nome) IN (
    'venda de soja',
    'venda de milho',
    'venda da produção',
    'venda da produã§ã£o',
    'venda da producao',
    'sementes',
    'fertilizantes',
    'adubo e fertilizantes',
    'defensivos',
    'defensivos agrícolas',
    'defensivos agrã­colas',
    'diesel e combustível',
    'diesel e combustã­vel',
    'máquinas',
    'mã¡quinas',
    'máquinas e implementos',
    'mã¡quinas e implementos',
    'arrendamento'
);

UPDATE categorias
SET area = 'PECUARIA'
WHERE LOWER(nome) IN (
    'venda de gado',
    'venda de leite',
    'venda de animais',
    'ração',
    'raã§ã£o',
    'sal mineral',
    'vacinas',
    'veterinário',
    'veterinã¡rio',
    'pastagem',
    'compra de bezerros',
    'medicamentos veterinários',
    'medicamentos veterinã¡rios',
    'manejo'
);

CREATE INDEX idx_categorias_empresa_area
    ON categorias (empresa_id, area);
