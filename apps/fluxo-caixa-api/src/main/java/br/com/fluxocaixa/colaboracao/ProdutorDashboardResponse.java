package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record ProdutorDashboardResponse(
        BigDecimal receitasMes,
        BigDecimal despesasMes,
        BigDecimal resultadoMes,
        long pendenciasAbertas,
        long documentosSemMovimentacao,
        long documentosAguardandoAnalise,
        long lancamentosSemClassificacao
) {
}
