package br.com.fluxocaixa.integration.asaas;

import java.math.BigDecimal;

public record AsaasInvoiceTaxesRequest(
        Boolean retainIss,
        BigDecimal iss,
        BigDecimal cofins,
        BigDecimal csll,
        BigDecimal inss,
        BigDecimal ir,
        BigDecimal pis
) {
}
