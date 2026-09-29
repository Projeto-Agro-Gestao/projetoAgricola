package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record SalvarParametroTributarioRequest(
        RegimeTributario regime,
        String competencia,
        String nome,
        BigDecimal aliquotaPercentual,
        BigDecimal parcelaDeduzir,
        String observacao) {
}
