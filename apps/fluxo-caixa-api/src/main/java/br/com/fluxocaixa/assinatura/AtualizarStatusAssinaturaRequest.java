package br.com.fluxocaixa.assinatura;

import jakarta.validation.constraints.NotNull;

public record AtualizarStatusAssinaturaRequest(
        @NotNull
        AssinaturaStatus status
) {
}
