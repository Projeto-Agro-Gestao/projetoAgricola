package br.com.fluxocaixa.categoria;

public class CategoriaNaoEncontradaException
        extends RuntimeException {

    public CategoriaNaoEncontradaException(Long categoriaId) {
        super(
                "Não foi possível encontrar a categoria de número "
                        + categoriaId
        );
    }
}