package br.com.fluxocaixa.contafinanceira;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LiquidacaoContaResponse(

        Long id,
        Long contaFinanceiraId,
        Long movimentacaoId,
        Boolean lancadaNoControleFinanceiro,

        BigDecimal valor,
        LocalDate dataLiquidacao,
        String observacao,

        LocalDateTime criadoEm

) {

    public static LiquidacaoContaResponse de(
            LiquidacaoConta liquidacao) {

        Long movimentacaoId =
                liquidacao.getMovimentacao() != null
                        ? liquidacao
                        .getMovimentacao()
                        .getId()
                        : null;

        return new LiquidacaoContaResponse(
                liquidacao.getId(),

                liquidacao
                        .getContaFinanceira()
                        .getId(),

                movimentacaoId,

                liquidacao
                        .foiLancadaNoControleFinanceiro(),

                liquidacao.getValor(),

                liquidacao.getDataLiquidacao(),

                liquidacao.getObservacao(),

                liquidacao.getCriadoEm()
        );
    }
}
