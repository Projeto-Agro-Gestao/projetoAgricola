package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record PropriedadeRuralResponse(
        Long id,
        String nome,
        String municipio,
        String estado,
        BigDecimal areaHectares
) {
    public static PropriedadeRuralResponse de(
            PropriedadeRural propriedade) {
        return new PropriedadeRuralResponse(
                propriedade.getId(),
                propriedade.getNome(),
                propriedade.getMunicipio(),
                propriedade.getEstado(),
                propriedade.getAreaHectares()
        );
    }
}
