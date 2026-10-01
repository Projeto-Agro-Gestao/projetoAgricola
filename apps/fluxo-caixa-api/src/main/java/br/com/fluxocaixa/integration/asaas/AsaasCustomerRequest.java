package br.com.fluxocaixa.integration.asaas;

public record AsaasCustomerRequest(
        String name,
        String cpfCnpj,
        String email,
        String phone,
        String postalCode,
        String address,
        String addressNumber,
        String complement,
        String province,
        String externalReference,
        boolean notificationDisabled,
        String observations
) {
}
