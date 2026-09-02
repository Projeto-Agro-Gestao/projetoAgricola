package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.usuario.StatusPagamento;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AtualizarPagamentoUsuarioRequest(

        @NotNull(message = "Informe o status do pagamento")
        StatusPagamento statusPagamento,

        LocalDate dataVencimentoPagamento

) {
}
