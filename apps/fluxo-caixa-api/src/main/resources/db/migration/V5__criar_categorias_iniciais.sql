INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Outras receitas',
    'RECEITA',
    TRUE
FROM empresas
WHERE ativo = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Combustível',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Manutenção',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Outras despesas',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Venda da produção',
    'RECEITA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND agricultura_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Insumos',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND agricultura_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Sementes',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND agricultura_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Fertilizantes',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND agricultura_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Defensivos',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND agricultura_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Máquinas',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND agricultura_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Venda de animais',
    'RECEITA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND pecuaria_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Venda de leite',
    'RECEITA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND pecuaria_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Ração',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND pecuaria_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Medicamentos veterinários',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND pecuaria_ativa = TRUE;


INSERT IGNORE INTO categorias (
    empresa_id,
    nome,
    tipo,
    ativo
)
SELECT
    id,
    'Manejo',
    'DESPESA',
    TRUE
FROM empresas
WHERE ativo = TRUE
  AND pecuaria_ativa = TRUE;