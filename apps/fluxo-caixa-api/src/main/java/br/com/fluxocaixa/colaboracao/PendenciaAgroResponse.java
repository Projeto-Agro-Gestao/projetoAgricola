package br.com.fluxocaixa.colaboracao;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PendenciaAgroResponse(
        Long id,
        Long empresaId,
        Long movimentacaoId,
        Long documentoId,
        TipoPendenciaAgro tipo,
        StatusPendenciaAgro status,
        PrioridadePendenciaAgro prioridade,
        String titulo,
        String descricao,
        LocalDate vencimento,
        String criadaPor,
        String responsavel,
        LocalDateTime criadoEm,
        LocalDateTime resolvidaEm
) {
    public static PendenciaAgroResponse de(
            PendenciaAgro pendencia) {
        return new PendenciaAgroResponse(
                pendencia.getId(),
                pendencia.getEmpresa().getId(),
                pendencia.getMovimentacao() == null
                        ? null
                        : pendencia.getMovimentacao().getId(),
                pendencia.getDocumento() == null
                        ? null
                        : pendencia.getDocumento().getId(),
                pendencia.getTipo(),
                pendencia.getStatus(),
                pendencia.getPrioridade(),
                pendencia.getTitulo(),
                pendencia.getDescricao(),
                pendencia.getVencimento(),
                pendencia.getCriadaPor() == null
                        ? null
                        : pendencia.getCriadaPor().getNome(),
                pendencia.getResponsavel() == null
                        ? null
                        : pendencia.getResponsavel().getNome(),
                pendencia.getCriadoEm(),
                pendencia.getResolvidaEm()
        );
    }
}
