package br.com.fluxocaixa.assinatura;

import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record AjustarTrialRequest(
        @Min(1)
        Integer dias,
        LocalDate trialFim
) {
}
