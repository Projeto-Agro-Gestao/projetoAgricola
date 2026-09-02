package br.com.fluxocaixa.contafinanceira;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ResumoContasFinanceirasResponse(

        BigDecimal totalAReceber,
        BigDecimal totalAPagar,
        BigDecimal diferencaPrevista,

        long quantidadeContasAReceber,
        long quantidadeContasAPagar,

        long quantidadeLembretes,
        long quantidadeVencidas,

        LocalDate dataInicial,
        LocalDate dataFinal

) {

    public boolean previsaoPositiva() {

        return diferencaPrevista.compareTo(
                BigDecimal.ZERO
        ) >= 0;
    }
}