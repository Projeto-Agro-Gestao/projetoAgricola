UPDATE assinatura_configuracoes
SET preco_mensal = 0.00,
    trial_habilitado = FALSE;

UPDATE assinaturas
SET valor_mensal = 0.00,
    status = 'ACTIVE',
    trial_inicio = NULL,
    trial_fim = NULL,
    proximo_vencimento = NULL
WHERE status <> 'CANCELLED';

UPDATE usuarios
SET acesso_liberado = TRUE,
    tipo_acesso = 'VITALICIO',
    acesso_expira_em = NULL,
    status_pagamento = 'ISENTO',
    data_vencimento_pagamento = NULL
WHERE ativo = TRUE
  AND papel NOT IN ('ADMINISTRADOR', 'SUPER_ADMIN');
