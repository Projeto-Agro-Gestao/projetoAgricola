package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsaasPaymentResponse(
        String id,
        String status,
        String billingType,
        BigDecimal value,
        String dueDate,
        String invoiceUrl,
        String bankSlipUrl,
        String externalReference
) {
}
