package br.com.fluxocaixa.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarCategoriaRequest(

        @NotBlank(message = "Digite o nome da categoria")
        @Size(
                max = 100,
                message = "O nome da categoria deve possuir no máximo 100 caracteres"
        )
        String nome

) {
}