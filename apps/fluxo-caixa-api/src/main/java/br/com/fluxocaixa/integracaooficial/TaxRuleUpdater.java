package br.com.fluxocaixa.integracaooficial;

import org.springframework.stereotype.Service;

@Service
public class TaxRuleUpdater {

    private final OfficialIntegrationProperties properties;

    public TaxRuleUpdater(OfficialIntegrationProperties properties) {
        this.properties = properties;
    }

    public boolean sincronizacaoAutomaticaHabilitada() {
        return properties.getTaxRules().isSyncEnabled();
    }
}
