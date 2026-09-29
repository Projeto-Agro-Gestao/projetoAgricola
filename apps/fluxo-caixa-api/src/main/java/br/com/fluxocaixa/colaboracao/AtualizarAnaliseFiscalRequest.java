package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record AtualizarAnaliseFiscalRequest(
        Long classificacaoContabilId,
        StatusTratamentoFiscal tratamentoFiscal,
        StatusAnaliseFiscal status,
        BigDecimal valorConsiderado,
        String observacao) {
}
