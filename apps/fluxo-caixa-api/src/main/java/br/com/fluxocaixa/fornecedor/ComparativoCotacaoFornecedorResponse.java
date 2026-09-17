package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;

public record ComparativoCotacaoFornecedorResponse(
        Long produtoId,
        String produtoNome,
        String categoriaProdutoNome,
        String fornecedorNome,
        BigDecimal melhorValorPorKg,
        BigDecimal melhorValorPorUnidade,
        BigDecimal melhorValorPorLote,
        BigDecimal totalCotado,
        long quantidadeCotacoes,
        boolean melhorCompra
) {
}
