package br.com.fluxocaixa.integration.asaas;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "asaas")
public record AsaasProperties(
        String apiKey,
        String baseUrl,
        String environment,
        String webhookToken,
        int timeoutSeconds
) {

    public boolean possuiApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}
