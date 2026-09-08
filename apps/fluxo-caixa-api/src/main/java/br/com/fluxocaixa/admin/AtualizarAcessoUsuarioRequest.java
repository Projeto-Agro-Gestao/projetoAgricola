package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.usuario.TipoAcessoUsuario;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AtualizarAcessoUsuarioRequest(

        @NotNull(message = "Informe se o acesso ficara liberado")
        Boolean acessoLiberado,

        TipoAcessoUsuario tipoAcesso,

        LocalDate acessoExpiraEm,

        Integer diasAcesso

) {
}
