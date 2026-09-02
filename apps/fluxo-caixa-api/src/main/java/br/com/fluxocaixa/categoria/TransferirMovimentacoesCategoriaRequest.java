package br.com.fluxocaixa.categoria;

import jakarta.validation.constraints.NotNull;

public record TransferirMovimentacoesCategoriaRequest(

        @NotNull(
                message =
                        "Escolha a categoria que receberá "
                                + "as movimentações"
        )
        Long categoriaDestinoId

) {
}