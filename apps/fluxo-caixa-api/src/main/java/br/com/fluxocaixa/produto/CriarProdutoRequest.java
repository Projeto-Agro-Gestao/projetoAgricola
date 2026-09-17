package br.com.fluxocaixa.produto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CriarProdutoRequest(
        @NotNull
        Long categoriaProdutoId,

        @NotBlank
        @Size(max = 150)
        String nome,

        @NotBlank
        @Size(max = 30)
        String unidadeBase,

        @DecimalMin(value = "0.001")
        @Digits(integer = 16, fraction = 3)
        BigDecimal pesoPadraoKg
) {
}
