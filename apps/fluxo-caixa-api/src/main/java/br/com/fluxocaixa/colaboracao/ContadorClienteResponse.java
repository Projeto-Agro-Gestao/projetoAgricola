package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContadorClienteResponse(
        Long empresaId,
        String cliente,
        String status,
        long pendencias,
        long semDocumento,
        long semClassificacao,
        long documentosNovos,
        BigDecimal resultadoMes,
        LocalDateTime ultimaAtividade
) {
}
