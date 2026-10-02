package br.com.fluxocaixa.usuario;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastrarUsuarioRequest(

        @NotBlank(
                message = "Digite o nome da propriedade"
        )
        @Size(
                max = 150,
                message = "O nome da propriedade deve possuir "
                        + "no máximo 150 caracteres"
        )
        String nomeEmpresa,

        @NotBlank(
                message = "Digite o nome do produtor"
        )
        @Size(
                max = 120,
                message = "O nome do produtor deve possuir "
                        + "no máximo 120 caracteres"
        )
        String nome,

        @NotBlank(
                message = "Digite o e-mail"
        )
        @Email(
                message = "Digite um e-mail válido"
        )
        @Size(
                max = 150,
                message = "O e-mail deve possuir "
                        + "no máximo 150 caracteres"
        )
        String email,

        @Size(
                max = 20,
                message = "O telefone deve possuir "
                        + "no máximo 20 caracteres"
        )
        String telefone,

        @NotBlank(
                message = "Digite a senha"
        )
        @Size(
                min = 8,
                max = 72,
                message = "A senha deve possuir entre "
                        + "8 e 72 caracteres"
        )
        String senha,

        @NotBlank(
                message = "Digite o CPF ou CNPJ da propriedade"
        )
        @Size(
                max = 20,
                message = "O documento deve possuir no máximo 20 caracteres"
        )
        String documento,

        @Size(
                max = 40,
                message = "A inscrição estadual deve possuir no máximo 40 caracteres"
        )
        String inscricaoEstadual,

        boolean isentoInscricaoEstadual,

        @Size(
                max = 40,
                message = "A inscrição municipal deve possuir no máximo 40 caracteres"
        )
        String inscricaoMunicipal,

        boolean isentoInscricaoMunicipal,

        boolean agriculturaAtiva,
        boolean pecuariaAtiva

) {

        @AssertTrue(
                message = "Escolha Agricultura (plantação), "
                        + "Pecuária (animais) ou as duas atividades"
        )
        public boolean isAtividadeSelecionada() {

                return agriculturaAtiva || pecuariaAtiva;
        }
}