package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CotacaoFornecedorResponse(
        Long id,
        Long fornecedorId,
        String fornecedorNome,
        Long produtoId,
        String produtoNome,
        Long categoriaProdutoId,
        String categoriaProdutoNome,
        String compradorNome,
        LocalDate dataCotacao,
        BigDecimal quantidade,
        String unidadeMedida,
        BigDecimal pesoTotalKg,
        BigDecimal valorTotal,
        BigDecimal valorLiquido,
        BigDecimal valorPorKg,
        BigDecimal valorPorUnidade,
        BigDecimal valorPorLote,
        BigDecimal frete,
        BigDecimal desconto,
        String observacao,
        StatusCotacaoFornecedor status,
        Long movimentacaoId,
        Long contaFinanceiraId
) {
    public static CotacaoFornecedorResponse de(
            CotacaoFornecedor cotacao) {

        return new CotacaoFornecedorResponse(
                cotacao.getId(),
                cotacao.getFornecedor().getId(),
                cotacao.getFornecedor().getNome(),
                cotacao.getProduto().getId(),
                cotacao.getProduto().getNome(),
                cotacao.getProduto().getCategoria().getId(),
                cotacao.getProduto().getCategoria().getNome(),
                cotacao.getCompradorNome(),
                cotacao.getDataCotacao(),
                cotacao.getQuantidade(),
                cotacao.getUnidadeMedida(),
                cotacao.getPesoTotalKg(),
                cotacao.getValorTotal(),
                cotacao.getValorLiquido(),
                cotacao.getValorPorKg(),
                cotacao.getValorPorUnidade(),
                cotacao.getValorPorLote(),
                cotacao.getFrete(),
                cotacao.getDesconto(),
                cotacao.getObservacao(),
                cotacao.getStatus(),
                cotacao.getMovimentacao() == null
                        ? null
                        : cotacao.getMovimentacao().getId(),
                cotacao.getContaFinanceira() == null
                        ? null
                        : cotacao.getContaFinanceira().getId()
        );
    }
}
