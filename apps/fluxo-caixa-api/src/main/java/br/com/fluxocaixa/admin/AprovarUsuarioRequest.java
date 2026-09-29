package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.usuario.PapelUsuario;
import jakarta.validation.constraints.NotNull;

public record AprovarUsuarioRequest(

        @NotNull(message = "Escolha PRODUTOR ou CONTADOR.")
        PapelUsuario papel

) {
}
