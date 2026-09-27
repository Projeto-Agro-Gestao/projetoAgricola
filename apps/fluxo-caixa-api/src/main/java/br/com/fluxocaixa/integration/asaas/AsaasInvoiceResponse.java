package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsaasInvoiceResponse(
        String object,
        String id,
        String status,
        String payment,
        String customer,
        String externalReference,
        BigDecimal value,
        String effectiveDate,
        String number,
        String validationCode,
        String pdfUrl,
        String xmlUrl,
        String serviceDescription,
        String municipalServiceId,
        String municipalServiceCode,
        String municipalServiceName,
        String observations
) {
}
