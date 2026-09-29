package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContadorDashboardFiscalResponse(
        Long empresaId,
        String empresaNome,
        LocalDate dataInicial,
        LocalDate dataFinal,
        BigDecimal receitaBruta,
        BigDecimal despesasRegistradas,
        BigDecimal resultadoFinanceiro,
        long documentosRecebidos,
        long documentosPendentes,
        long despesasSemDocumento,
        long despesasPendentesClassificacao,
        BigDecimal valorPotencialmenteDedutivel,
        BigDecimal valorNaoConsiderado,
        BigDecimal baseEstimadaSimulacao,
        BigDecimal tributoEstimado,
        BigDecimal resultadoAposTributo,
        RegimeTributario regimeAtual,
        String aviso) {
}
