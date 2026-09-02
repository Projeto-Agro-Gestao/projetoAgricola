package br.com.fluxocaixa.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PontoFluxoCaixaResponse(

        LocalDate data,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldoDoDia

) {
}