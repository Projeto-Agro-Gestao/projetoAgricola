package br.com.fluxocaixa.assinatura;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NotaFiscalResponse(
        Long id,
        Long pagamentoId,
        NotaFiscalStatus status,
        BigDecimal valor,
        LocalDate dataEmissaoPrevista,
        LocalDate dataAutorizacao,
        String numeroNota,
        String codigoValidacao,
        String pdfUrl,
        String xmlUrl,
        String descricaoServico,
        String mensagemErro
) {

    public static NotaFiscalResponse de(NotaFiscal notaFiscal) {
        return new NotaFiscalResponse(
                notaFiscal.getId(),
                notaFiscal.getPagamento().getId(),
                notaFiscal.getStatus(),
                notaFiscal.getValor(),
                notaFiscal.getDataEmissaoPrevista(),
                notaFiscal.getDataAutorizacao(),
                notaFiscal.getNumeroNota(),
                notaFiscal.getCodigoValidacao(),
                notaFiscal.getPdfUrl(),
                notaFiscal.getXmlUrl(),
                notaFiscal.getDescricaoServico(),
                notaFiscal.getMensagemErro()
        );
    }
}
