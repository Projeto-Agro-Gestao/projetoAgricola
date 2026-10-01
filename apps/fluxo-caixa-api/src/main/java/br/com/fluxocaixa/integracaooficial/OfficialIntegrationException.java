package br.com.fluxocaixa.integracaooficial;

public class OfficialIntegrationException extends RuntimeException {

    private final OfficialIntegrationStatus status;

    public OfficialIntegrationException(
            String message,
            OfficialIntegrationStatus status) {
        super(message);
        this.status = status;
    }

    public OfficialIntegrationException(
            String message,
            OfficialIntegrationStatus status,
            Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public OfficialIntegrationStatus getStatus() {
        return status;
    }
}
