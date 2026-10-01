package br.com.fluxocaixa.integracaooficial;

import java.time.LocalDateTime;

public record OfficialIntegrationStatusResponse(
        OfficialCnpjProviderType provider,
        OfficialIntegrationStatus status,
        boolean credencialConfigurada,
        LocalDateTime ultimoTeste,
        LocalDateTime ultimaSincronizacao,
        String mensagem
) {
}
