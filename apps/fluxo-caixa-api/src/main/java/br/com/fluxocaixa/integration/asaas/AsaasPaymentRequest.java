package br.com.fluxocaixa.integration.asaas;

import java.math.BigDecimal;

public record AsaasPaymentRequest(
        String customer,
        String billingType,
        BigDecimal value,
        String dueDate,
        String description,
        String externalReference
) {
}
