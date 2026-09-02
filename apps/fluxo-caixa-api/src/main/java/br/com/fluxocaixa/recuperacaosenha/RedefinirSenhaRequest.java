package br.com.fluxocaixa.recuperacaosenha;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaRequest(

        @NotBlank(message = "O token é obrigatório.")
        String token,

        @NotBlank(message = "A nova senha é obrigatória.")
        @Size(
                min = 8,
                max = 72,
                message = "A nova senha deve ter entre 8 e 72 caracteres."
        )
        String novaSenha
) {
}