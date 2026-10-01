package br.com.fluxocaixa.fornecedor;

public class ConsultaCnpjIndisponivelException
        extends RuntimeException {

    public ConsultaCnpjIndisponivelException(
            String message,
            Throwable cause) {

        super(message, cause);
    }
}
