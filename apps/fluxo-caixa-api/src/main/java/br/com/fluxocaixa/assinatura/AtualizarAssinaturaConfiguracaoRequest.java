package br.com.fluxocaixa.assinatura;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AtualizarAssinaturaConfiguracaoRequest(
        @NotNull @DecimalMin("0.01")
        BigDecimal precoMensal,

        boolean trialHabilitado,

        @Min(0)
        int diasTrialPadrao,

        @Min(0)
        int diasAvisoTrial,

        @Min(0)
        int diasCarencia
) {
}
