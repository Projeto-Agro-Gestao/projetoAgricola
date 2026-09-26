package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsaasCustomerResponse(
        String object,
        String id,
        String name,
        String email,
        String cpfCnpj,
        String externalReference
) {
}
