package br.com.fluxocaixa.contafinanceira;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConfigurarLembreteContaRequest(

        @NotNull(
                message =
                        "Informe se o lembrete ficará ativo"
        )
        Boolean ativo,

        @Min(
                value = 0,
                message =
                        "A antecedência do lembrete "
                                + "não pode ser negativa"
        )
        @Max(
                value = 365,
                message =
                        "A antecedência do lembrete deve "
                                + "ser de no máximo 365 dias"
        )
        Integer antecedenciaDias

) {
}