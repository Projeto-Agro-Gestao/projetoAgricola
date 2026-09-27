ALTER TABLE assinatura_configuracoes
    ADD COLUMN intervalo_alerta_minutos INT NOT NULL DEFAULT 3
        AFTER dias_carencia,
    ADD COLUMN pix_habilitado BOOLEAN NOT NULL DEFAULT TRUE
        AFTER intervalo_alerta_minutos,
    ADD COLUMN boleto_habilitado BOOLEAN NOT NULL DEFAULT TRUE
        AFTER pix_habilitado,
    ADD COLUMN dias_aviso_vencimento INT NOT NULL DEFAULT 3
        AFTER boleto_habilitado;

UPDATE assinatura_configuracoes
SET preco_mensal = 0.00,
    dias_carencia = 5,
    intervalo_alerta_minutos = 3,
    pix_habilitado = TRUE,
    boleto_habilitado = TRUE,
    dias_aviso_vencimento = 3;

ALTER TABLE assinaturas
    ADD COLUMN dia_vencimento INT NULL
        AFTER proximo_vencimento;

UPDATE assinaturas
SET dia_vencimento = DAY(proximo_vencimento)
WHERE proximo_vencimento IS NOT NULL
  AND dia_vencimento IS NULL;
