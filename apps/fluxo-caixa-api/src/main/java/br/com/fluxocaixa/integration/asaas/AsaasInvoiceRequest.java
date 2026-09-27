package br.com.fluxocaixa.integration.asaas;

import java.math.BigDecimal;

public record AsaasInvoiceRequest(
        String payment,
        String serviceDescription,
        String observations,
        String externalReference,
        BigDecimal value,
        BigDecimal deductions,
        String effectiveDate,
        String municipalServiceId,
        String municipalServiceCode,
        String municipalServiceName,
        Boolean updatePayment,
        AsaasInvoiceTaxesRequest taxes
) {
}
