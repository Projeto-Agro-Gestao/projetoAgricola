package br.com.fluxocaixa.integration.asaas;

public record AsaasCustomerRequest(
        String name,
        String cpfCnpj,
        String email,
        String phone,
        String externalReference,
        boolean notificationDisabled
) {
}
