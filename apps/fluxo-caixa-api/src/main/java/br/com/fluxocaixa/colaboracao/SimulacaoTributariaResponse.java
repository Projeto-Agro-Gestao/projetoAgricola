package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SimulacaoTributariaResponse(
        Long empresaId,
        LocalDate dataInicial,
        LocalDate dataFinal,
        RegimeTributario regime,
        BigDecimal receitaConsiderada,
        BigDecimal despesasConsideradas,
        BigDecimal baseEstimada,
        BigDecimal tributoEstimado,
        BigDecimal cargaEfetivaPercentual,
        String premissas,
        String aviso) {
}
