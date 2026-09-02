package br.com.fluxocaixa.contafinanceira;

public class ContaFinanceiraNaoEncontradaException
        extends RuntimeException {

    public ContaFinanceiraNaoEncontradaException(
            Long contaId) {

        super(
                "A conta financeira de código "
                        + contaId
                        + " não foi encontrada"
        );
    }
}