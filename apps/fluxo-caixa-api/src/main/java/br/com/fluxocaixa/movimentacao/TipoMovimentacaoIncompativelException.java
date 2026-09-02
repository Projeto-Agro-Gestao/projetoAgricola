package br.com.fluxocaixa.movimentacao;

public class TipoMovimentacaoIncompativelException
        extends RuntimeException {

    public TipoMovimentacaoIncompativelException(
            TipoMovimentacao tipoMovimentacao,
            TipoMovimentacao tipoCategoria) {

        super(
                "Você informou '" + tipoMovimentacao.getDescricao()
                        + "', mas a categoria escolhida pertence a '"
                        + tipoCategoria.getDescricao() + "'"
        );
    }
}