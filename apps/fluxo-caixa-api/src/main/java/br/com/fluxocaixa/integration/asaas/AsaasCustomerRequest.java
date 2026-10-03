package br.com.fluxocaixa.integration.asaas;

@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
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
