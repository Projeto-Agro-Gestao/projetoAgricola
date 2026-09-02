package br.com.fluxocaixa.contafinanceira;

public class OperacaoContaFinanceiraInvalidaException
        extends RuntimeException {

    public OperacaoContaFinanceiraInvalidaException(
            String mensagem) {

        super(mensagem);
    }
}