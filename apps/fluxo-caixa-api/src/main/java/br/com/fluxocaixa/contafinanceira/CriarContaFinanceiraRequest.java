package br.com.fluxocaixa.contafinanceira;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CriarContaFinanceiraRequest(

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
                        "Escolha conta a pagar "
                                + "ou conta a receber"
        )
        TipoContaFinanceira tipo,

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

        Boolean lembreteAtivo,

        @Min(
                value = 0,
                message =
                        "A antecedência do lembrete "
                                + "não pode ser negativa"
        )
        @Max(
                value = 365,
                message =
                        "A antecedência do lembrete deve "
                                + "ser de no máximo 365 dias"
        )
        Integer antecedenciaLembreteDias,

        @Size(
                max = 500,
                message =
                        "A observação deve ter no máximo "
                                + "500 caracteres"
        )
        String observacao

) {
}