package br.com.fluxocaixa.dashboard;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface TotalDiarioMovimentacaoProjection {

    LocalDate getData();

    TipoMovimentacao getTipo();

    BigDecimal getTotal();
}