package br.com.fluxocaixa.assinatura;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AtualizarAssinaturaConfiguracaoRequest(
        @NotNull @DecimalMin("0.00")
        BigDecimal precoMensal,

        boolean trialHabilitado,

        @Min(0)
        int diasTrialPadrao,

        @Min(0)
        int diasAvisoTrial,

        @Min(0)
        int diasCarencia,

        @Min(1)
        Integer intervaloAlertaMinutos,

        Boolean pixHabilitado,

        Boolean boletoHabilitado,

        @Min(0)
        Integer diasAvisoVencimento,

        Boolean nfseHabilitada,

        Boolean nfseEmissaoAutomatica,

        String nfseMunicipalServiceId,

        String nfseMunicipalServiceCode,

        String nfseMunicipalServiceName,

        String nfseServiceDescriptionTemplate,

        String nfseDefaultObservations,

        @DecimalMin("0.00")
        BigDecimal nfseIss,

        @DecimalMin("0.00")
        BigDecimal nfseCofins,

        @DecimalMin("0.00")
        BigDecimal nfseCsll,

        @DecimalMin("0.00")
        BigDecimal nfseInss,

        @DecimalMin("0.00")
        BigDecimal nfseIr,

        @DecimalMin("0.00")
        BigDecimal nfsePis,

        Boolean nfseRetainIss
) {
}
