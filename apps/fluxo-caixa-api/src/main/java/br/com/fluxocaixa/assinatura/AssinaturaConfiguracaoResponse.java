package br.com.fluxocaixa.assinatura;

import java.math.BigDecimal;

public record AssinaturaConfiguracaoResponse(
        BigDecimal precoMensal,
        boolean trialHabilitado,
        int diasTrialPadrao,
        int diasAvisoTrial,
        int diasCarencia,
        int intervaloAlertaMinutos,
        boolean pixHabilitado,
        boolean boletoHabilitado,
        int diasAvisoVencimento,
        boolean nfseHabilitada,
        boolean nfseEmissaoAutomatica,
        String nfseMunicipalServiceId,
        String nfseMunicipalServiceCode,
        String nfseMunicipalServiceName,
        String nfseServiceDescriptionTemplate,
        String nfseDefaultObservations,
        BigDecimal nfseIss,
        BigDecimal nfseCofins,
        BigDecimal nfseCsll,
        BigDecimal nfseInss,
        BigDecimal nfseIr,
        BigDecimal nfsePis,
        boolean nfseRetainIss
) {

    public static AssinaturaConfiguracaoResponse de(
            AssinaturaConfiguracao configuracao) {

        return new AssinaturaConfiguracaoResponse(
                configuracao.getPrecoMensal(),
                configuracao.isTrialHabilitado(),
                configuracao.getDiasTrialPadrao(),
                configuracao.getDiasAvisoTrial(),
                configuracao.getDiasCarencia(),
                configuracao.getIntervaloAlertaMinutos(),
                configuracao.isPixHabilitado(),
                configuracao.isBoletoHabilitado(),
                configuracao.getDiasAvisoVencimento(),
                configuracao.isNfseHabilitada(),
                configuracao.isNfseEmissaoAutomatica(),
                configuracao.getNfseMunicipalServiceId(),
                configuracao.getNfseMunicipalServiceCode(),
                configuracao.getNfseMunicipalServiceName(),
                configuracao.getNfseServiceDescriptionTemplate(),
                configuracao.getNfseDefaultObservations(),
                configuracao.getNfseIss(),
                configuracao.getNfseCofins(),
                configuracao.getNfseCsll(),
                configuracao.getNfseInss(),
                configuracao.getNfseIr(),
                configuracao.getNfsePis(),
                configuracao.isNfseRetainIss()
        );
    }
}
