package br.com.fluxocaixa.movimentacao;

import jakarta.validation.constraints.NotNull;

public record TrocarCategoriaMovimentacaoRequest(

        @NotNull(message = "Escolha a nova categoria")
        Long categoriaId

) {
}
