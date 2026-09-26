package br.com.fluxocaixa.integration.asaas;

public class AsaasException extends RuntimeException {

    public AsaasException(String mensagem) {
        super(mensagem);
    }

    public AsaasException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
