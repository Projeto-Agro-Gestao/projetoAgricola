package br.com.fluxocaixa.contafinanceira;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LiquidarContaFinanceiraRequest(

        @NotNull(
                message =
                        "Informe o valor pago ou recebido"
        )
        @DecimalMin(
                value = "0.01",
                message =
                        "O valor deve ser maior que zero"
        )
        BigDecimal valor,

        @NotNull(
                message =
                        "Informe a data do pagamento "
                                + "ou recebimento"
        )
        LocalDate dataLiquidacao,

        @Size(
                max = 500,
                message =
                        "A observação deve ter no máximo "
                                + "500 caracteres"
        )
        String observacao,

        @NotNull(
                message =
                        "Informe se deseja lançar no "
                                + "Controle financeiro"
        )
        Boolean lancarNoControleFinanceiro,

        Long categoriaId

) {
}
