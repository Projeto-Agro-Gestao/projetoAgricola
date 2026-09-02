
package br.com.fluxocaixa.movimentacao;

public class MovimentacaoNaoEncontradaException
        extends RuntimeException {

    public MovimentacaoNaoEncontradaException(
            Long movimentacaoId) {

        super(
                "A movimentação com o identificador "
                        + movimentacaoId
                        + " não foi encontrada"
        );
    }
}