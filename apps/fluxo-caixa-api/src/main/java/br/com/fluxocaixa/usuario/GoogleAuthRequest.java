package br.com.fluxocaixa.usuario;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(

        @NotBlank(
                message = "Credencial do Google invalida"
        )
        @Size(
                max = 4096,
                message = "Credencial do Google invalida"
        )
        String credential,

        @Size(
                max = 150,
                message = "O nome da propriedade deve possuir "
                        + "no maximo 150 caracteres"
        )
        String nomeEmpresa,

        @Size(
                max = 20,
                message = "O telefone deve possuir "
                        + "no maximo 20 caracteres"
        )
        String telefone,

        @Size(
                max = 20,
                message = "O documento deve possuir no maximo 20 caracteres"
        )
        String documento,

        @Size(
                max = 40,
                message = "A inscricao estadual deve possuir no maximo 40 caracteres"
        )
        String inscricaoEstadual,

        boolean isentoInscricaoEstadual,

        @Size(
                max = 40,
                message = "A inscricao municipal deve possuir no maximo 40 caracteres"
        )
        String inscricaoMunicipal,

        boolean isentoInscricaoMunicipal,

        boolean agriculturaAtiva,
        boolean pecuariaAtiva
) {
}
