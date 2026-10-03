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

    public String ambienteEfetivo() {
        if (environment != null && !environment.isBlank()) {
            return switch (environment.trim().toUpperCase(java.util.Locale.ROOT)) {
                case "PRODUCTION", "PRODUCAO" -> "PRODUCTION";
                case "SANDBOX" -> "SANDBOX";
                default -> throw new AsaasException("ASAAS_ENVIRONMENT deve ser SANDBOX ou PRODUCTION.");
            };
        }
        if (baseUrl != null && !baseUrl.isBlank()) {
            String host;
            try { host = java.net.URI.create(baseUrl.trim()).getHost(); }
            catch (IllegalArgumentException exception) { throw new AsaasException("ASAAS_BASE_URL invalida."); }
            if ("api.asaas.com".equalsIgnoreCase(host)) return "PRODUCTION";
            if ("api-sandbox.asaas.com".equalsIgnoreCase(host)) return "SANDBOX";
        }
        return apiKey != null && apiKey.trim().startsWith("$aact_prod_")
                ? "PRODUCTION" : "SANDBOX";
    }

    public String urlEfetiva() {
        String ambiente = ambienteEfetivo();
        String url = baseUrl == null || baseUrl.isBlank()
                ? (ambiente.equals("PRODUCTION")
                    ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3")
                : baseUrl.trim().replaceAll("/+$", "");
        java.net.URI uri;
        try { uri = java.net.URI.create(url); }
        catch (IllegalArgumentException exception) { throw new AsaasException("ASAAS_BASE_URL invalida."); }
        String host = uri.getHost();
        if (host == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null
                || !("https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && ("localhost".equals(host) || "127.0.0.1".equals(host))))) {
            throw new AsaasException("ASAAS_BASE_URL deve utilizar HTTPS, sem credenciais na URL.");
        }
        if (("api.asaas.com".equalsIgnoreCase(host) && !ambiente.equals("PRODUCTION"))
                || ("api-sandbox.asaas.com".equalsIgnoreCase(host) && !ambiente.equals("SANDBOX"))) {
            throw new AsaasException("ASAAS_BASE_URL e ASAAS_ENVIRONMENT apontam para ambientes diferentes.");
        }
        String chave = apiKey == null ? "" : apiKey.trim();
        if ((chave.startsWith("$aact_prod_") && !ambiente.equals("PRODUCTION"))
                || (chave.startsWith("$aact_hmlg_") && !ambiente.equals("SANDBOX"))) {
            throw new AsaasException("A chave ASAAS_API_KEY pertence a outro ambiente. Confira SANDBOX ou PRODUCTION no Render.");
        }
        return url;
    }
}
