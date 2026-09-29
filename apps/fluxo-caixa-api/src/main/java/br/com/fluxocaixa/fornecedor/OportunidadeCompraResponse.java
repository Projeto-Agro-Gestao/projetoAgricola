package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;

public record OportunidadeCompraResponse(
        String produtoNome,
        String unidadeMedida,
        String fornecedorMelhorPreco,
        BigDecimal melhorValorUnitario,
        String fornecedorComparado,
        BigDecimal valorUnitarioComparado,
        BigDecimal economiaPotencial,
        BigDecimal diferencaPercentual,
        String idadePreco
) {
}
