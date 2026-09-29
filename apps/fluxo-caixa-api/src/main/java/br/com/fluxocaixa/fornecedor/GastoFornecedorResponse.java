package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GastoFornecedorResponse(
        Long fornecedorId,
        String fornecedorNome,
        BigDecimal total,
        BigDecimal participacaoPercentual,
        long compras,
        BigDecimal ticketMedio,
        LocalDate ultimaCompra
) {
}
