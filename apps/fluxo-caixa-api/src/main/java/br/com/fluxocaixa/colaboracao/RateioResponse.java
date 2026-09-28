package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.util.List;

public record RateioResponse(
        Long id,
        Long movimentacaoId,
        TipoRateio tipo,
        String observacao,
        List<Item> itens
) {
    public record Item(
            Long propriedadeRuralId,
            String propriedadeNome,
            String descricao,
            BigDecimal percentual,
            BigDecimal valor
    ) {
    }

    public static RateioResponse de(Rateio rateio) {
        return new RateioResponse(
                rateio.getId(),
                rateio.getMovimentacao().getId(),
                rateio.getTipo(),
                rateio.getObservacao(),
                rateio.getItens()
                        .stream()
                        .map(item -> new Item(
                                item.getPropriedadeRural() == null
                                        ? null
                                        : item.getPropriedadeRural().getId(),
                                item.getPropriedadeRural() == null
                                        ? null
                                        : item.getPropriedadeRural().getNome(),
                                item.getDescricao(),
                                item.getPercentual(),
                                item.getValor()
                        ))
                        .toList()
        );
    }
}
