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
        int diasAvisoVencimento
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
                configuracao.getDiasAvisoVencimento()
        );
    }
}
