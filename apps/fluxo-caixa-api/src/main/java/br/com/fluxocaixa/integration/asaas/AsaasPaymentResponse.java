package br.com.fluxocaixa.integration.asaas;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AsaasPaymentResponse(
        String id,
        String status,
        String billingType,
        BigDecimal value,
        LocalDate dueDate,
        String invoiceUrl,
        String bankSlipUrl,
        String externalReference
) {
}
