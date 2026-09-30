package br.com.fluxocaixa.fornecedor;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class ReceitaFederalCnpjService {

    private final RestClient restClient;
    private final String baseUrl;
    private final String token;

    public ReceitaFederalCnpjService(
            RestClient.Builder restClientBuilder,
            @Value("${receita.cnpj.base-url:}") String baseUrl,
            @Value("${receita.cnpj.token:}") String token) {

        this.restClient = restClientBuilder.build();
        this.baseUrl = baseUrl == null ? "" : baseUrl.trim();
        this.token = token == null ? "" : token.trim();
    }

    public ConsultaCnpjFornecedorResponse consultar(String cnpj) {
        String normalizado = normalizarCnpj(cnpj);

        if (baseUrl.isBlank()) {
            throw new IllegalStateException(
                    "Consulta de CNPJ nao configurada. Configure RECEITA_CNPJ_BASE_URL e, quando exigido, RECEITA_CNPJ_TOKEN."
            );
        }

        JsonNode resposta = restClient
                .get()
                .uri(baseUrl + "/" + normalizado)
                .headers(headers -> {
                    if (!token.isBlank()) {
                        headers.set(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        );
                    }
                })
                .retrieve()
                .body(JsonNode.class);

        if (resposta == null || resposta.isNull()) {
            throw new IllegalStateException(
                    "A consulta de CNPJ nao retornou dados"
            );
        }

        return new ConsultaCnpjFornecedorResponse(
                normalizado,
                primeiroTexto(
                        resposta,
                        "nomeFantasia",
                        "nome_fantasia",
                        "fantasia"
                ),
                primeiroTexto(
                        resposta,
                        "razaoSocial",
                        "razao_social",
                        "nome",
                        "nomeEmpresarial"
                ),
                primeiroTexto(
                        resposta,
                        "inscricaoMunicipal",
                        "inscricao_municipal"
                ),
                primeiroTexto(
                        resposta,
                        "inscricaoEstadual",
                        "inscricao_estadual"
                ),
                primeiroTexto(
                        resposta,
                        "regimeTributario",
                        "regime_tributario",
                        "porte",
                        "opcaoPeloSimples"
                ),
                primeiroTexto(resposta, "cep", "codigoPostal"),
                primeiroTexto(
                        resposta,
                        "logradouro",
                        "endereco",
                        "descricaoLogradouro"
                ),
                primeiroTexto(resposta, "numero", "numeroEndereco"),
                primeiroTexto(resposta, "complemento"),
                primeiroTexto(resposta, "bairro"),
                primeiroTexto(
                        resposta,
                        "municipio",
                        "cidade",
                        "nomeMunicipio"
                ),
                primeiroTexto(resposta, "uf", "estado"),
                primeiroTexto(resposta, "pais", "paisNome")
        );
    }

    private String normalizarCnpj(String cnpj) {
        if (cnpj == null) {
            throw new IllegalArgumentException("Informe o CNPJ");
        }

        String normalizado = cnpj.replaceAll("\\D", "");

        if (normalizado.length() != 14) {
            throw new IllegalArgumentException(
                    "CNPJ deve conter 14 digitos"
            );
        }

        return normalizado;
    }

    private String primeiroTexto(
            JsonNode node,
            String... campos) {

        for (String campo : campos) {
            JsonNode valor = node.path(campo);

            if (!valor.isMissingNode()
                    && !valor.isNull()
                    && !valor.asText().isBlank()) {
                return valor.asText();
            }
        }

        return null;
    }
}
