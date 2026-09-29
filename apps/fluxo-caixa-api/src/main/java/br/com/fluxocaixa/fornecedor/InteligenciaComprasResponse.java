package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;
import java.util.List;

public record InteligenciaComprasResponse(
        BigDecimal gastoMes,
        BigDecimal gastoAno,
        BigDecimal economiaPotencial,
        BigDecimal economiaRealizada,
        long fornecedoresAtivos,
        long cotacoesAbertas,
        String produtoMaiorAumento,
        String melhorOportunidadeAtual,
        List<OportunidadeCompraResponse> oportunidades,
        List<GastoFornecedorResponse> gastosPorFornecedor,
        List<HistoricoPrecoProdutoResponse> historicoProdutos
) {
}
