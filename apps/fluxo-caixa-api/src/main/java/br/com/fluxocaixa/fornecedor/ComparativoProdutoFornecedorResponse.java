package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;

public record ComparativoProdutoFornecedorResponse(

        String produtoNome,
        String produtoClassificacao,
        String unidadeMedida,
        String fornecedorNome,
        BigDecimal menorValorUnitario,
        BigDecimal maiorValorUnitario,
        BigDecimal mediaValorUnitario,
        BigDecimal totalComprado,
        BigDecimal quantidadeTotal,
        long quantidadeRegistros

) {
}
