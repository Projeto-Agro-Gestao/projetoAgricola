package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContadorMovimentacaoFiscalResponse(
        Long id,
        LocalDate data,
        TipoMovimentacao tipo,
        String descricao,
        String fornecedor,
        BigDecimal valor,
        String categoriaFinanceira,
        String propriedade,
        String atividade,
        int documentos,
        boolean possuiDocumento,
        StatusDocumentoAgro statusDocumento,
        Long classificacaoContabilId,
        String classificacaoContabilNome,
        StatusTratamentoFiscal tratamentoFiscal,
        StatusAnaliseFiscal statusFiscal,
        BigDecimal valorConsiderado,
        String observacaoFiscal,
        boolean incluidoNaSimulacao
) {
}
