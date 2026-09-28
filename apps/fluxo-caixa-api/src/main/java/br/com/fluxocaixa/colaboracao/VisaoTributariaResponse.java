package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record VisaoTributariaResponse(
        int ano,
        BigDecimal receitasAno,
        BigDecimal despesasAno,
        BigDecimal resultadoAcumulado,
        BigDecimal resultadoProjetado,
        long pendenciasFiscais,
        String aviso
) {
}
