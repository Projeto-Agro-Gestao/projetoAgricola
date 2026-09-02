package br.com.fluxocaixa.categoria;

public class TransferenciaCategoriaInvalidaException
        extends RuntimeException {

    public TransferenciaCategoriaInvalidaException(
            String mensagem) {

        super(mensagem);
    }
}