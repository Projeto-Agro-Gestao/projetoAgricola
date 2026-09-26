package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class AsaasClient {

    private final AsaasProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AsaasClient(
            AsaasProperties properties,
            ObjectMapper objectMapper) {

        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(
                        Math.max(properties.timeoutSeconds(), 3)
                ))
                .build();
    }

    public AsaasCustomerResponse criarCliente(
            AsaasCustomerRequest request) {

        return enviarJson(
                "/customers",
                request,
                AsaasCustomerResponse.class
        );
    }

    public AsaasPaymentResponse criarPagamento(
            AsaasPaymentRequest request) {

        return enviarJson(
                "/payments",
                request,
                AsaasPaymentResponse.class
        );
    }

    public AsaasPixQrCodeResponse buscarPixQrCode(
            String paymentId) {

        return enviarGet(
                "/payments/" + codificar(paymentId) + "/pixQrCode",
                AsaasPixQrCodeResponse.class
        );
    }

    public AsaasBoletoLinhaResponse buscarLinhaDigitavel(
            String paymentId) {

        return enviarGet(
                "/payments/" + codificar(paymentId)
                        + "/identificationField",
                AsaasBoletoLinhaResponse.class
        );
    }

    private <T> T enviarJson(
            String caminho,
            Object corpo,
            Class<T> tipoResposta) {

        validarConfiguracao();

        try {
            String json = objectMapper.writeValueAsString(corpo);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl() + caminho))
                    .timeout(Duration.ofSeconds(
                            Math.max(properties.timeoutSeconds(), 3)
                    ))
                    .header(HttpHeaders.CONTENT_TYPE,
                            MediaType.APPLICATION_JSON_VALUE)
                    .header("access_token", properties.apiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            return enviar(request, tipoResposta);
        } catch (IOException exception) {
            throw new AsaasException(
                    "Nao foi possivel preparar a chamada ao Asaas.",
                    exception
            );
        }
    }

    private <T> T enviarGet(
            String caminho,
            Class<T> tipoResposta) {

        validarConfiguracao();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl() + caminho))
                .timeout(Duration.ofSeconds(
                        Math.max(properties.timeoutSeconds(), 3)
                ))
                .header("access_token", properties.apiKey())
                .GET()
                .build();

        return enviar(request, tipoResposta);
    }

    private <T> T enviar(
            HttpRequest request,
            Class<T> tipoResposta) {

        try {
            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new AsaasException(
                        "Asaas retornou erro HTTP "
                                + response.statusCode()
                );
            }

            return objectMapper.readValue(
                    response.body(),
                    tipoResposta
            );
        } catch (IOException exception) {
            throw new AsaasException(
                    "Nao foi possivel ler a resposta do Asaas.",
                    exception
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AsaasException(
                    "Chamada ao Asaas interrompida.",
                    exception
            );
        }
    }

    private void validarConfiguracao() {
        if (!properties.possuiApiKey()) {
            throw new AsaasException(
                    "Configure ASAAS_API_KEY para gerar cobrancas."
            );
        }
    }

    private String baseUrl() {
        return properties.baseUrl().replaceAll("/+$", "");
    }

    private String codificar(String valor) {
        return URLEncoder.encode(
                valor,
                StandardCharsets.UTF_8
        );
    }
}
