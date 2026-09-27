package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsaasFiscalInfoResponse(
        String object,
        String status,
        String municipalInscription,
        String regime,
        String specialTaxRegime
) {
}
