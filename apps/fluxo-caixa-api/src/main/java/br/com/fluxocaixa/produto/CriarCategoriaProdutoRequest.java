package br.com.fluxocaixa.produto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarCategoriaProdutoRequest(
        @NotBlank
        @Size(max = 100)
        String nome
) {
}
