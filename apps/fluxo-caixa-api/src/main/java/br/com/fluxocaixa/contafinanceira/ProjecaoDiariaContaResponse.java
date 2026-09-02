package br.com.fluxocaixa.contafinanceira;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public record ProjecaoDiariaContaResponse(

        LocalDate data,

        BigDecimal totalAReceber,

        BigDecimal totalAPagar,

        BigDecimal diferencaPrevista

) {

    private static final BigDecimal ZERO =
            new BigDecimal("0.00");

    public static ProjecaoDiariaContaResponse de(
            ProjecaoDiariaContaProjection projecao) {

        BigDecimal valorAReceber =
                projecao.getTotalAReceber();

        BigDecimal valorAPagar =
                projecao.getTotalAPagar();

        if (valorAReceber == null) {
            valorAReceber = ZERO;
        }

        if (valorAPagar == null) {
            valorAPagar = ZERO;
        }

        BigDecimal totalAReceber =
                valorAReceber.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        BigDecimal totalAPagar =
                valorAPagar.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        BigDecimal diferencaPrevista =
                totalAReceber
                        .subtract(totalAPagar)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        return new ProjecaoDiariaContaResponse(
                projecao.getData(),
                totalAReceber,
                totalAPagar,
                diferencaPrevista
        );
    }
}