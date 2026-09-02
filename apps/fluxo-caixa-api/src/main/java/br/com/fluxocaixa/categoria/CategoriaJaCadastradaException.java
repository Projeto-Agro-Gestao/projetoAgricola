package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;

public class CategoriaJaCadastradaException extends RuntimeException {

    public CategoriaJaCadastradaException(
            String nome,
            TipoMovimentacao tipo) {

        super(
                "A categoria '" + nome + "' já está cadastrada como "
                        + tipo.getDescricao().toLowerCase()
        );
    }
}