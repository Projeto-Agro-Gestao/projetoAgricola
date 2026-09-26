package br.com.fluxocaixa.integration.asaas;

public class AsaasException extends RuntimeException {

    private final Integer statusCode;
    private final String responseBody;

    public AsaasException(String mensagem) {
        super(mensagem);
        this.statusCode = null;
        this.responseBody = null;
    }

    public AsaasException(String mensagem, Throwable causa) {
        super(mensagem, causa);
        this.statusCode = null;
        this.responseBody = null;
    }

    public AsaasException(
            String mensagem,
            Integer statusCode,
            String responseBody) {

        super(mensagem);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public boolean contemCodigo(String codigo) {
        return responseBody != null
                && codigo != null
                && responseBody.contains("\"code\"")
                && responseBody.contains("\"" + codigo + "\"");
    }
}
