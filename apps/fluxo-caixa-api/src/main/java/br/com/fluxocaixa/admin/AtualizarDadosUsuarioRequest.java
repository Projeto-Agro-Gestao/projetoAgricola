package br.com.fluxocaixa.admin;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarDadosUsuarioRequest(

        @NotBlank(
                message = "Digite o nome da propriedade"
        )
        @Size(
                max = 150,
                message = "O nome da propriedade deve possuir "
                        + "no maximo 150 caracteres"
        )
        String nomeEmpresa,

        @NotBlank(
                message = "Digite o nome do produtor"
        )
        @Size(
                max = 120,
                message = "O nome do produtor deve possuir "
                        + "no maximo 120 caracteres"
        )
        String nome,

        @NotBlank(
                message = "Digite o e-mail"
        )
        @Email(
                message = "Digite um e-mail valido"
        )
        @Size(
                max = 150,
                message = "O e-mail deve possuir "
                        + "no maximo 150 caracteres"
        )
        String email,

        @Size(
                max = 20,
                message = "O telefone deve possuir "
                        + "no maximo 20 caracteres"
        )
        String telefone,

        boolean agriculturaAtiva,
        boolean pecuariaAtiva

) {

    @AssertTrue(
            message = "Escolha Agricultura, Pecuaria ou as duas atividades"
    )
    public boolean isAtividadeSelecionada() {

        return agriculturaAtiva || pecuariaAtiva;
    }
}
