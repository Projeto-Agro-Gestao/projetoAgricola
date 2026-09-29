package br.com.fluxocaixa.colaboracao;

import java.time.LocalDate;

public record SalvarRegimeTributarioRequest(
        RegimeTributario regime,
        LocalDate dataInicio,
        LocalDate dataFim,
        String competencia,
        String observacao) {
}
