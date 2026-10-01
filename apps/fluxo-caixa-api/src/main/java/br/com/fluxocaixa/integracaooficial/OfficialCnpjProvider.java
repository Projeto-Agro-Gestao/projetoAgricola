package br.com.fluxocaixa.integracaooficial;

public interface OfficialCnpjProvider {

    OfficialCnpjProviderType tipo();

    OfficialIntegrationStatusResponse status();

    OfficialIntegrationStatusResponse testarConexao();

    CnpjOfficialDataResponse consultar(String cnpj);
}
