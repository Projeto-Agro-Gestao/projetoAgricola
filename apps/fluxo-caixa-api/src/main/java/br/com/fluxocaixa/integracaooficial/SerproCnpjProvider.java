package br.com.fluxocaixa.integracaooficial;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Component
public class SerproCnpjProvider implements OfficialCnpjProvider {

    private final RestClient restClient;
    private final OfficialIntegrationProperties properties;
    private volatile String accessToken;
    private volatile Instant tokenExpiresAt;
    private volatile LocalDateTime ultimoTeste;

    public SerproCnpjProvider(
            RestClient.Builder restClientBuilder,
            OfficialIntegrationProperties properties) {
        this.restClient = restClientBuilder.build();
        this.properties = properties;
    }

    @Override
    public OfficialCnpjProviderType tipo() {
        return OfficialCnpjProviderType.SERPRO;
    }

    @Override
    public OfficialIntegrationStatusResponse status() {
        OfficialIntegrationProperties.Cnpj cnpj =
                properties.getCnpj();

        OfficialIntegrationStatus status =
                cnpj.hasSerproCredentials()
                        ? OfficialIntegrationStatus.CONFIGURADO
                        : OfficialIntegrationStatus.NAO_CONFIGURADO;

        return new OfficialIntegrationStatusResponse(
                tipo(),
                status,
                cnpj.hasSerproCredentials(),
                ultimoTeste,
                null,
                status == OfficialIntegrationStatus.CONFIGURADO
                        ? "Credenciais SERPRO configuradas no backend."
                        : "Configure base URL, token URL, consumer key e consumer secret."
        );
    }

    @Override
    public OfficialIntegrationStatusResponse testarConexao() {
        try {
            obterToken();
            ultimoTeste = LocalDateTime.now();
            return new OfficialIntegrationStatusResponse(
                    tipo(),
                    OfficialIntegrationStatus.CONECTADO,
                    true,
                    ultimoTeste,
                    null,
                    "Token obtido com sucesso no provider oficial."
            );
        } catch (OfficialIntegrationException exception) {
            ultimoTeste = LocalDateTime.now();
            return new OfficialIntegrationStatusResponse(
                    tipo(),
                    exception.getStatus(),
                    properties.getCnpj().hasSerproCredentials(),
                    ultimoTeste,
                    null,
                    exception.getMessage()
            );
        }
    }

    @Override
    public CnpjOfficialDataResponse consultar(String cnpj) {
        OfficialIntegrationProperties.Cnpj config =
                properties.getCnpj();
        String token = obterToken();
        String path = config.getCnpjPathTemplate()
                .replace("{cnpj}", cnpj);

        try {
            JsonNode resposta = restClient
                    .get()
                    .uri(config.getBaseUrl() + path)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .body(JsonNode.class);

            if (resposta == null || resposta.isNull()) {
                throw new OfficialIntegrationException(
                        "Provider oficial nao retornou dados para o CNPJ.",
                        OfficialIntegrationStatus.ERRO
                );
            }

            return normalizar(cnpj, resposta, config.getBaseUrl());
        } catch (RestClientException exception) {
            throw new OfficialIntegrationException(
                    "Servico oficial de CNPJ indisponivel ou retornou erro.",
                    OfficialIntegrationStatus.INDISPONIVEL,
                    exception
            );
        }
    }

    private String obterToken() {
        if (accessToken != null
                && tokenExpiresAt != null
                && Instant.now().isBefore(tokenExpiresAt.minusSeconds(30))) {
            return accessToken;
        }

        OfficialIntegrationProperties.Cnpj config =
                properties.getCnpj();

        if (!config.hasSerproCredentials()) {
            throw new OfficialIntegrationException(
                    "Credenciais SERPRO nao configuradas.",
                    OfficialIntegrationStatus.NAO_CONFIGURADO
            );
        }

        String basic = Base64.getEncoder()
                .encodeToString((config.getConsumerKey()
                        + ":"
                        + config.getConsumerSecret())
                        .getBytes(StandardCharsets.UTF_8));

        try {
            JsonNode tokenResponse = restClient
                    .post()
                    .uri(config.getTokenUrl())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                    .body("grant_type=client_credentials")
                    .retrieve()
                    .body(JsonNode.class);

            String token = texto(tokenResponse, "access_token");

            if (token == null) {
                throw new OfficialIntegrationException(
                        "Token SERPRO nao retornado.",
                        OfficialIntegrationStatus.CREDENCIAIS_INVALIDAS
                );
            }

            long expiresIn = numero(tokenResponse, "expires_in", 3600L);
            accessToken = token;
            tokenExpiresAt = Instant.now().plusSeconds(expiresIn);
            return accessToken;
        } catch (RestClientException exception) {
            throw new OfficialIntegrationException(
                    "Nao foi possivel autenticar no provider SERPRO.",
                    OfficialIntegrationStatus.CREDENCIAIS_INVALIDAS,
                    exception
            );
        }
    }

    private CnpjOfficialDataResponse normalizar(
            String cnpj,
            JsonNode node,
            String fonte) {
        return new CnpjOfficialDataResponse(
                cnpj,
                primeiroTexto(node, "razaoSocial", "razao_social", "nomeEmpresarial", "nome"),
                primeiroTexto(node, "nomeFantasia", "nome_fantasia", "fantasia"),
                primeiroTexto(node, "situacaoCadastral", "situacao", "descricaoSituacaoCadastral"),
                data(node, "dataSituacao", "data_situacao", "dataSituacaoCadastral"),
                primeiroTexto(node, "naturezaJuridica", "natureza_juridica"),
                primeiroTexto(node, "porte", "descricaoPorte"),
                primeiroTexto(node, "cnaePrincipal", "cnae_principal", "cnaeFiscal"),
                List.of(),
                primeiroTexto(node, "logradouro", "descricaoLogradouro"),
                primeiroTexto(node, "numero", "numeroEndereco"),
                primeiroTexto(node, "complemento"),
                primeiroTexto(node, "bairro"),
                primeiroTexto(node, "cep", "codigoPostal"),
                primeiroTexto(node, "municipio", "cidade", "nomeMunicipio"),
                primeiroTexto(node, "uf", "estado"),
                tipo(),
                fonte,
                LocalDateTime.now(),
                false
        );
    }

    private String primeiroTexto(JsonNode node, String... campos) {
        for (String campo : campos) {
            String valor = texto(node, campo);
            if (valor != null) {
                return valor;
            }
        }
        return null;
    }

    private String texto(JsonNode node, String campo) {
        if (node == null) {
            return null;
        }
        JsonNode valor = node.path(campo);
        return valor.isMissingNode()
                || valor.isNull()
                || valor.asText().isBlank()
                ? null
                : valor.asText();
    }

    private long numero(JsonNode node, String campo, long padrao) {
        JsonNode valor = node == null ? null : node.path(campo);
        return valor == null || !valor.canConvertToLong()
                ? padrao
                : valor.asLong();
    }

    private LocalDate data(JsonNode node, String... campos) {
        for (String campo : campos) {
            String valor = texto(node, campo);

            if (valor == null) {
                continue;
            }

            try {
                return LocalDate.parse(valor);
            } catch (RuntimeException ignored) {
                return null;
            }
        }

        return null;
    }
}
