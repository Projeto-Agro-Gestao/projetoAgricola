package br.com.fluxocaixa.configuracao;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "google.oauth")
public record GoogleOAuthProperties(
        String clientId
) {

    public boolean habilitado() {
        return clientId != null && !clientId.isBlank();
    }
}
