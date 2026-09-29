package br.com.fluxocaixa.colaboracao;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RegimeTributarioEmpresaResponse(
        Long id,
        RegimeTributario regime,
        LocalDate dataInicio,
        LocalDate dataFim,
        String competencia,
        String situacao,
        String observacao,
        String responsavel,
        LocalDateTime revisadoEm) {

    public static RegimeTributarioEmpresaResponse de(
            RegimeTributarioEmpresa regime) {

        return new RegimeTributarioEmpresaResponse(
                regime.getId(),
                regime.getRegime(),
                regime.getDataInicio(),
                regime.getDataFim(),
                regime.getCompetencia(),
                regime.getSituacao(),
                regime.getObservacao(),
                regime.getResponsavel() == null
                        ? null
                        : regime.getResponsavel().getNome(),
                regime.getRevisadoEm()
        );
    }
}
