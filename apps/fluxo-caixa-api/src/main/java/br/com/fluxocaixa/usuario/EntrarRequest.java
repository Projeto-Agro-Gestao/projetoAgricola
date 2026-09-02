package br.com.fluxocaixa.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EntrarRequest(

        @NotBlank(message = "Digite o e-mail")
        @Email(message = "Digite um e-mail válido")
        @Size(
                max = 150,
                message = "O e-mail deve possuir no máximo 150 caracteres"
        )
        String email,

        @NotBlank(message = "Digite a senha")
        @Size(
                max = 72,
                message = "A senha deve possuir no máximo 72 caracteres"
        )
        String senha

) {
}