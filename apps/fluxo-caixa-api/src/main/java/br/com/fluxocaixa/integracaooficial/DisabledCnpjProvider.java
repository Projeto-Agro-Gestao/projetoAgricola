package br.com.fluxocaixa.integracaooficial;

import org.springframework.stereotype.Component;

@Component
public class DisabledCnpjProvider implements OfficialCnpjProvider {

    @Override
    public OfficialCnpjProviderType tipo() {
        return OfficialCnpjProviderType.DISABLED;
    }

    @Override
    public OfficialIntegrationStatusResponse status() {
        return new OfficialIntegrationStatusResponse(
                tipo(),
                OfficialIntegrationStatus.NAO_CONFIGURADO,
                false,
                null,
                null,
                "Consulta oficial de CNPJ ainda nao configurada."
        );
    }

    @Override
    public OfficialIntegrationStatusResponse testarConexao() {
        return status();
    }

    @Override
    public CnpjOfficialDataResponse consultar(String cnpj) {
        throw new OfficialIntegrationException(
                "Consulta oficial de CNPJ ainda nao configurada.",
                OfficialIntegrationStatus.NAO_CONFIGURADO
        );
    }
}
