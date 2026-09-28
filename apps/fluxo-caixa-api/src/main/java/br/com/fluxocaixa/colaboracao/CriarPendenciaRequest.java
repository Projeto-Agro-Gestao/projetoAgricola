package br.com.fluxocaixa.colaboracao;

import java.time.LocalDate;

public record CriarPendenciaRequest(
        Long movimentacaoId,
        TipoPendenciaAgro tipo,
        PrioridadePendenciaAgro prioridade,
        String titulo,
        String descricao,
        LocalDate vencimento
) {
}
