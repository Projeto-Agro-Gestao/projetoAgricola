package br.com.fluxocaixa.integration.asaas;

public record AsaasCustomerResponse(
        String id,
        String name,
        String email,
        String cpfCnpj,
        String externalReference
) {
}
