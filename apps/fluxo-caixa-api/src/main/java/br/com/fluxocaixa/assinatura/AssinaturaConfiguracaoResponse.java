package br.com.fluxocaixa.assinatura;

import java.math.BigDecimal;

public record AssinaturaConfiguracaoResponse(
        BigDecimal precoMensal,
        boolean trialHabilitado,
        int diasTrialPadrao,
        int diasAvisoTrial,
        int diasCarencia
) {

    public static AssinaturaConfiguracaoResponse de(
            AssinaturaConfiguracao configuracao) {

        return new AssinaturaConfiguracaoResponse(
                configuracao.getPrecoMensal(),
                configuracao.isTrialHabilitado(),
                configuracao.getDiasTrialPadrao(),
                configuracao.getDiasAvisoTrial(),
                configuracao.getDiasCarencia()
        );
    }
}
