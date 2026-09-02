package br.com.fluxocaixa.contafinanceira;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ProjecaoDiariaContaProjection {

    LocalDate getData();

    BigDecimal getTotalAReceber();

    BigDecimal getTotalAPagar();
}