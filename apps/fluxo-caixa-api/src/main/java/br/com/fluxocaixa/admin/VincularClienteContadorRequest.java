package br.com.fluxocaixa.admin;

import jakarta.validation.constraints.NotNull;

public record VincularClienteContadorRequest(

        @NotNull(message = "Informe a empresa do cliente.")
        Long empresaId
) {
}
