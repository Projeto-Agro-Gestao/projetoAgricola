package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;

public record ParametroTributarioResponse(
        Long id,
        RegimeTributario regime,
        String competencia,
        String nome,
        BigDecimal aliquotaPercentual,
        BigDecimal parcelaDeduzir,
        String observacao) {

    public static ParametroTributarioResponse de(
            ParametroTributario parametro) {

        return new ParametroTributarioResponse(
                parametro.getId(),
                parametro.getRegime(),
                parametro.getCompetencia(),
                parametro.getNome(),
                parametro.getAliquotaPercentual(),
                parametro.getParcelaDeduzir(),
                parametro.getObservacao()
        );
    }
}
