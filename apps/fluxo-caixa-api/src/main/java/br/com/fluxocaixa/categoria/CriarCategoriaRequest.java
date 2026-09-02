package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarCategoriaRequest(

        @NotBlank(message = "Digite o nome da categoria")
        @Size(
                max = 100,
                message = "O nome da categoria deve possuir no máximo 100 caracteres"
        )
        String nome,

        @NotNull(message = "Informe se o dinheiro entrou ou saiu")
        TipoMovimentacao tipo

) {
}