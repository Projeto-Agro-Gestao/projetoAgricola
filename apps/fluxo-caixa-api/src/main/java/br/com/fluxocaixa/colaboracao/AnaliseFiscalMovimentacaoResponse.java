package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AnaliseFiscalMovimentacaoResponse(
        Long id,
        Long movimentacaoId,
        String descricaoMovimentacao,
        BigDecimal valorMovimentacao,
        Long classificacaoContabilId,
        String classificacaoContabilNome,
        StatusTratamentoFiscal tratamentoFiscal,
        StatusAnaliseFiscal status,
        BigDecimal valorConsiderado,
        String observacao,
        String validadoPor,
        LocalDateTime validadoEm) {

    public static AnaliseFiscalMovimentacaoResponse de(
            AnaliseFiscalMovimentacao analise) {

        return new AnaliseFiscalMovimentacaoResponse(
                analise.getId(),
                analise.getMovimentacao().getId(),
                analise.getMovimentacao().getDescricao(),
                analise.getMovimentacao().getValor(),
                analise.getClassificacaoContabil() == null
                        ? null
                        : analise.getClassificacaoContabil().getId(),
                analise.getClassificacaoContabil() == null
                        ? null
                        : analise.getClassificacaoContabil().getNome(),
                analise.getTratamentoFiscal(),
                analise.getStatus(),
                analise.getValorConsiderado(),
                analise.getObservacao(),
                analise.getValidadoPor() == null
                        ? null
                        : analise.getValidadoPor().getNome(),
                analise.getValidadoEm()
        );
    }
}
