package br.com.fluxocaixa.admin;

import jakarta.validation.constraints.NotNull;

public record AtualizarAcessoUsuarioRequest(

        @NotNull(message = "Informe se o acesso ficara liberado")
        Boolean acessoLiberado

) {
}
