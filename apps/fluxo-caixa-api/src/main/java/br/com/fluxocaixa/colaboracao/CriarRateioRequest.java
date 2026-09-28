package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.util.List;

public record CriarRateioRequest(
        Long movimentacaoId,
        TipoRateio tipo,
        String observacao,
        List<Item> itens
) {
    public record Item(
            Long propriedadeRuralId,
            String descricao,
            BigDecimal percentual,
            BigDecimal valor
    ) {
    }
}
