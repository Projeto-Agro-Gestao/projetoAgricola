package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.usuario.PapelUsuario;
import jakarta.validation.constraints.NotNull;

public record AtualizarPapelUsuarioRequest(

        @NotNull(message = "Informe o perfil do usuario")
        PapelUsuario papel
) {
}
