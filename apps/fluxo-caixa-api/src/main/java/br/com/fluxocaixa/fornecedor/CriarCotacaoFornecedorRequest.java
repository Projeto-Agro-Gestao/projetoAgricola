package br.com.fluxocaixa.fornecedor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CriarCotacaoFornecedorRequest(
        @NotNull
        Long fornecedorId,

        @NotNull
        Long produtoId,

        @Size(max = 150)
        String compradorNome,

        @NotNull
        LocalDate dataCotacao,

        @NotNull
        @DecimalMin(value = "0.001")
        @Digits(integer = 16, fraction = 3)
        BigDecimal quantidade,

        @NotBlank
        @Size(max = 30)
        String unidadeMedida,

        @DecimalMin(value = "0.001")
        @Digits(integer = 16, fraction = 3)
        BigDecimal pesoTotalKg,

        @NotNull
        @DecimalMin(value = "0.01")
        @Digits(integer = 17, fraction = 2)
        BigDecimal valorTotal,

        @DecimalMin(value = "0.00")
        @Digits(integer = 17, fraction = 2)
        BigDecimal frete,

        @DecimalMin(value = "0.00")
        @Digits(integer = 17, fraction = 2)
        BigDecimal desconto,

        @Size(max = 500)
        String observacao
) {
}
