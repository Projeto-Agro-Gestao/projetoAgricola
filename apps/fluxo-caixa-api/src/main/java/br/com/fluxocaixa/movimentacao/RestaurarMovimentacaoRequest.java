package br.com.fluxocaixa.movimentacao;

import jakarta.validation.constraints.NotNull;

public record RestaurarMovimentacaoRequest(

        @NotNull(message = "Escolha a categoria da movimentação")
        Long categoriaId

) {
}
