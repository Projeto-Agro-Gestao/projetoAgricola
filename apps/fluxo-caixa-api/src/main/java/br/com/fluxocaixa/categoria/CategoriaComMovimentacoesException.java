package br.com.fluxocaixa.categoria;

public class CategoriaComMovimentacoesException
        extends RuntimeException {

    public CategoriaComMovimentacoesException(
            String nomeCategoria) {

        super(
                "Só pode deletar essa categoria após deletar todas as movimentações."
                        + " Categoria: \""
                        + nomeCategoria
                        + "\"."
        );
    }
}
