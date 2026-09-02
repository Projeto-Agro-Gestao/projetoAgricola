package br.com.fluxocaixa.contafinanceira;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AtualizarContaFinanceiraRequest(

        @NotNull(
                message =
                        "Informe a categoria da conta"
        )
        Long categoriaId,

        @NotBlank(
                message =
                        "Informe a descrição da conta"
        )
        @Size(
                max = 150,
                message =
                        "A descrição deve ter no máximo "
                                + "150 caracteres"
        )
        String descricao,

        @Size(
                max = 150,
                message =
                        "O favorecido deve ter no máximo "
                                + "150 caracteres"
        )
        String favorecido,

        @Size(
                max = 80,
                message =
                        "O número do documento deve ter "
                                + "no máximo 80 caracteres"
        )
        String numeroDocumento,

        @NotNull(
                message =
                        "Informe o valor da conta"
        )
        @DecimalMin(
                value = "0.01",
                message =
                        "O valor da conta deve ser "
                                + "maior que zero"
        )
        BigDecimal valorTotal,

        @NotNull(
                message =
                        "Informe a data de emissão"
        )
        LocalDate dataEmissao,

        @NotNull(
                message =
                        "Informe a data de vencimento"
        )
        LocalDate dataVencimento,

        @Size(
                max = 500,
                message =
                        "A observação deve ter no máximo "
                                + "500 caracteres"
        )
        String observacao

) {
}