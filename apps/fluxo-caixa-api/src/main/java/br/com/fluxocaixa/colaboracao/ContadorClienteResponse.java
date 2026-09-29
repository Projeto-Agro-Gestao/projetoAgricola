package br.com.fluxocaixa.colaboracao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContadorClienteResponse(
        Long empresaId,
        String empresaNome,
        String statusEmpresa,
        long pendenciasAbertas,
        long despesasSemDocumento,
        long movimentacoesSemClassificacao,
        long documentosNovos,
        BigDecimal resultadoMes,
        LocalDateTime ultimaAtividade
) {
}
