package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger LOGGER =
            LoggerFactory.getLogger(AsaasClient.class);

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

    public AsaasCustomerResponse atualizarCliente(String customerId, AsaasCustomerRequest request) {
        return enviarJson("/customers/" + codificar(customerId), request, AsaasCustomerResponse.class, "PUT");
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

    public AsaasFiscalInfoResponse buscarFiscalInfo() {

        return enviarGet(
                "/fiscalInfo",
                AsaasFiscalInfoResponse.class
        );
    }

    public AsaasInvoiceResponse criarNotaFiscal(
            AsaasInvoiceRequest request) {

        return enviarJson(
                "/invoices",
                request,
                AsaasInvoiceResponse.class
        );
    }

    public AsaasInvoiceResponse buscarNotaFiscal(
            String invoiceId) {

        return enviarGet(
                "/invoices/" + codificar(invoiceId),
                AsaasInvoiceResponse.class
        );
    }

    public AsaasInvoiceResponse autorizarNotaFiscal(
            String invoiceId) {

        return enviarPostSemCorpo(
                "/invoices/" + codificar(invoiceId) + "/authorize",
                AsaasInvoiceResponse.class
        );
    }

    private <T> T enviarJson(
            String caminho,
            Object corpo,
            Class<T> tipoResposta) {

        return enviarJson(caminho, corpo, tipoResposta, "POST");
    }

    private <T> T enviarJson(String caminho, Object corpo, Class<T> tipoResposta, String metodo) {

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
                    .header("User-Agent", "AgroGestao/1.0")
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .header("access_token", properties.apiKey().trim())
                    .method(metodo, HttpRequest.BodyPublishers.ofString(json))
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
                .header("User-Agent", "AgroGestao/1.0")
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .header("access_token", properties.apiKey().trim())
                .GET()
                .build();

        return enviar(request, tipoResposta);
    }

    private <T> T enviarPostSemCorpo(
            String caminho,
            Class<T> tipoResposta) {

        validarConfiguracao();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl() + caminho))
                .timeout(Duration.ofSeconds(
                        Math.max(properties.timeoutSeconds(), 3)
                ))
                .header(HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_JSON_VALUE)
                .header("User-Agent", "AgroGestao/1.0")
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .header("access_token", properties.apiKey().trim())
                .POST(HttpRequest.BodyPublishers.noBody())
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
                                + response.statusCode(),
                        response.statusCode(),
                        response.body()
                );
            }

            try {
                return objectMapper.readValue(
                        response.body(),
                        tipoResposta
                );
            } catch (IOException exception) {
                LOGGER.warn(
                        "Falha ao ler resposta do Asaas com HTTP {}: {}",
                        response.statusCode(),
                        exception.getClass().getSimpleName()
                );
                throw new AsaasException(
                        "Nao foi possivel ler a resposta do Asaas.",
                        exception
                );
            }
        } catch (IOException exception) {
            LOGGER.warn(
                    "Falha de comunicacao com Asaas: {}",
                    exception.getClass().getSimpleName()
            );
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
        return properties.urlEfetiva();
    }

    private String codificar(String valor) {
        return URLEncoder.encode(
                valor,
                StandardCharsets.UTF_8
        );
    }
}
