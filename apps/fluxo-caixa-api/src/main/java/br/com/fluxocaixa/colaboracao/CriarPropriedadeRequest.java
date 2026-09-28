package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record CriarPropriedadeRequest(
        String nome,
        String municipio,
        String estado,
        BigDecimal areaHectares
) {
}
