package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;

import java.math.BigDecimal;

public record SugerirClassificacaoRequest(
        String descricao,
        String fornecedor,
        TipoMovimentacao tipo,
        BigDecimal valor
) {
}
