package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HistoricoPrecoProdutoResponse(
        String produtoNome,
        String unidadeMedida,
        BigDecimal precoAtual,
        BigDecimal precoAnterior,
        BigDecimal media30Dias,
        BigDecimal media90Dias,
        BigDecimal menorPrecoHistorico,
        BigDecimal maiorPrecoHistorico,
        BigDecimal variacaoPercentual,
        String melhorFornecedorConhecido,
        LocalDate dataUltimoPreco
) {
}
