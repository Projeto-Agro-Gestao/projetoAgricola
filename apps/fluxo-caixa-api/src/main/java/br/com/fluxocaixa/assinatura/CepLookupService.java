package br.com.fluxocaixa.assinatura;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class CepLookupService {

    private final RestClient restClient;

    public CepLookupService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .baseUrl("https://viacep.com.br/ws")
                .build();
    }

    public CepConsultaResponse consultar(String cepInformado) {
        String cep = cepInformado == null
                ? ""
                : cepInformado.replaceAll("[^0-9]", "");

        if (cep.length() != 8) {
            throw new IllegalArgumentException(
                    "CEP deve possuir 8 digitos."
            );
        }

        try {
            Map<?, ?> response =
                    restClient.get()
                            .uri("/{cep}/json/", cep)
                            .retrieve()
                            .body(Map.class);

            if (response == null
                    || Boolean.TRUE.equals(response.get("erro"))) {
                return new CepConsultaResponse(
                        cep,
                        null,
                        null,
                        null,
                        null,
                        "ViaCEP",
                        "CEP nao encontrado."
                );
            }

            return new CepConsultaResponse(
                    cep,
                    texto(response.get("logradouro")),
                    texto(response.get("bairro")),
                    texto(response.get("localidade")),
                    texto(response.get("uf")),
                    "ViaCEP",
                    "Endereco localizado."
            );
        } catch (RestClientException exception) {
            return new CepConsultaResponse(
                    cep,
                    null,
                    null,
                    null,
                    null,
                    "ViaCEP",
                    "Nao foi possivel consultar o CEP automaticamente. Preencha o endereco manualmente."
            );
        }
    }

    private String texto(Object valor) {
        return valor == null ? null : valor.toString();
    }
}
