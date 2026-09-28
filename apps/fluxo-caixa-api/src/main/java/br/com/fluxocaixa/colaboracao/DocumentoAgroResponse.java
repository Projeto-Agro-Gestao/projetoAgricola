package br.com.fluxocaixa.colaboracao;

import java.time.LocalDateTime;

public record DocumentoAgroResponse(
        Long id,
        Long empresaId,
        Long movimentacaoId,
        String nomeArquivo,
        String tipoConteudo,
        long tamanhoBytes,
        TipoDocumentoAgro tipoDocumento,
        StatusDocumentoAgro status,
        String observacao,
        String enviadoPor,
        LocalDateTime criadoEm
) {
    public static DocumentoAgroResponse de(
            DocumentoAgro documento) {
        return new DocumentoAgroResponse(
                documento.getId(),
                documento.getEmpresa().getId(),
                documento.getMovimentacao() == null
                        ? null
                        : documento.getMovimentacao().getId(),
                documento.getNomeArquivo(),
                documento.getTipoConteudo(),
                documento.getTamanhoBytes(),
                documento.getTipoDocumento(),
                documento.getStatus(),
                documento.getObservacao(),
                documento.getEnviadoPor() == null
                        ? null
                        : documento.getEnviadoPor().getNome(),
                documento.getCriadoEm()
        );
    }
}
