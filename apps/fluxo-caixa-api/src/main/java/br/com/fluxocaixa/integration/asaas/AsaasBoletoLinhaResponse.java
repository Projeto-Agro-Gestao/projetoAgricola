package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsaasBoletoLinhaResponse(
        String identificationField
) {
}
