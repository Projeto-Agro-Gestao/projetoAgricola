package br.com.fluxocaixa.movimentacao;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AtualizarMovimentacaoRequest(

        @NotBlank(message = "Digite uma descrição")
        @Size(
                max = 150,
                message = "A descrição deve possuir no máximo 150 caracteres"
        )
        String descricao,

        @NotNull(message = "Digite o valor")
        @DecimalMin(
                value = "0.00",
                inclusive = false,
                message = "O valor deve ser maior que zero"
        )
        @Digits(
                integer = 17,
                fraction = 2,
                message = "Digite um valor válido com no máximo duas casas decimais"
        )
        BigDecimal valor,

        @NotNull(message = "Informe se o dinheiro entrou ou saiu")
        TipoMovimentacao tipo,

        @NotNull(message = "Escolha uma categoria")
        @Positive(message = "Escolha uma categoria válida")
        Long categoriaId,

        @NotNull(message = "Informe a data")
        @PastOrPresent(message = "A data não pode estar no futuro")
        LocalDate dataMovimentacao,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres"
        )
        String observacao
        ,

        Long fornecedorId,

        @Size(
                max = 150,
                message = "O nome do comprador deve possuir no maximo 150 caracteres"
        )
        String compradorNome,

        @Size(
                max = 150,
                message = "O nome da mercadoria deve possuir no maximo 150 caracteres"
        )
        String produtoNome,

        @Size(
                max = 100,
                message = "A classificacao do produto deve possuir no maximo 100 caracteres"
        )
        String produtoClassificacao,

        @DecimalMin(
                value = "0.00",
                inclusive = false,
                message = "A quantidade deve ser maior que zero"
        )
        @Digits(
                integer = 16,
                fraction = 3,
                message = "Digite uma quantidade valida"
        )
        BigDecimal quantidade,

        @Size(
                max = 30,
                message = "A unidade deve possuir no maximo 30 caracteres"
        )
        String unidadeMedida
        ,

        Long propriedadeRuralId,

        Long atividadeRuralId

) {
}
