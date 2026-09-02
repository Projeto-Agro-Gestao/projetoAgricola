package br.com.fluxocaixa.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ResumoFinanceiroResponse(

        LocalDate dataInicial,
        LocalDate dataFinal,

        BigDecimal totalEntrou,
        BigDecimal totalSaiu,
        BigDecimal quantoSobrou,

        BigDecimal margemLucro,
        BigDecimal ganhoSobreCusto

) {
}