package br.com.fluxocaixa.assinatura;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AssinaturaPagamentoResponse(
        Long id,
        String asaasPaymentId,
        String descricao,
        FormaPagamentoAssinatura formaPagamento,
        StatusPagamentoAssinatura status,
        BigDecimal valor,
        LocalDate vencimento,
        LocalDate pagoEm,
        String invoiceUrl,
        String boletoUrl,
        String linhaDigitavel,
        String pixQrCodeBase64,
        String pixCopiaCola,
        LocalDateTime pixExpiraEm
) {

    public static AssinaturaPagamentoResponse de(
            AssinaturaPagamento pagamento) {

        return new AssinaturaPagamentoResponse(
                pagamento.getId(),
                pagamento.getAsaasPaymentId(),
                pagamento.getDescricao(),
                pagamento.getFormaPagamento(),
                pagamento.getStatus(),
                pagamento.getValor(),
                pagamento.getVencimento(),
                pagamento.getPagoEm(),
                pagamento.getInvoiceUrl(),
                pagamento.getBoletoUrl(),
                pagamento.getLinhaDigitavel(),
                pagamento.getPixQrCodeBase64(),
                pagamento.getPixCopiaCola(),
                pagamento.getPixExpiraEm()
        );
    }
}
