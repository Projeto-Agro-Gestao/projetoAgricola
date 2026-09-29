ALTER TABLE documentos_agro
    MODIFY COLUMN conteudo LONGBLOB NULL;

UPDATE usuarios
SET tipo_acesso = 'NORMAL'
WHERE tipo_acesso IS NULL;

UPDATE usuarios
SET status_pagamento = 'TESTE'
WHERE status_pagamento IS NULL;

UPDATE usuarios
SET papel = 'PRODUTOR'
WHERE papel = 'PROPRIETARIO';

INSERT INTO assinaturas (
    empresa_id,
    status,
    valor_mensal,
    trial_inicio,
    trial_fim,
    proximo_vencimento,
    dia_vencimento
)
SELECT
    e.id,
    CASE
        WHEN ac.trial_habilitado THEN 'TRIAL'
        ELSE 'PENDING'
    END,
    ac.preco_mensal,
    CASE
        WHEN ac.trial_habilitado THEN CURRENT_DATE()
        ELSE NULL
    END,
    CASE
        WHEN ac.trial_habilitado THEN DATE_ADD(CURRENT_DATE(), INTERVAL ac.dias_trial_padrao DAY)
        ELSE NULL
    END,
    NULL,
    NULL
FROM empresas e
CROSS JOIN (
    SELECT
        preco_mensal,
        trial_habilitado,
        dias_trial_padrao
    FROM assinatura_configuracoes
    ORDER BY id
    LIMIT 1
) ac
WHERE NOT EXISTS (
    SELECT 1
    FROM assinaturas a
    WHERE a.empresa_id = e.id
);

UPDATE usuarios u
SET u.acesso_liberado = TRUE
WHERE u.ativo = TRUE
  AND u.acesso_liberado IS NULL;
