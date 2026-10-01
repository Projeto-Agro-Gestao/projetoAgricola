package br.com.fluxocaixa.integracaooficial;

import java.util.List;

public record OfficialIntegrationSetupResponse(
        OfficialCnpjProviderType provider,
        OfficialIntegrationStatus status,
        boolean prontoParaTeste,
        List<OfficialIntegrationRequirementResponse> requisitos,
        List<OfficialIntegrationSetupStepResponse> passos,
        List<OfficialIntegrationLinkResponse> links,
        String mensagem
) {
}
