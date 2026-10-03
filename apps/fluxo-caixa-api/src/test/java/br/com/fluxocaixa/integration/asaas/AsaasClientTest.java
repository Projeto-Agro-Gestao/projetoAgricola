package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AsaasClientTest {

    @Test
    void falhaComMensagemClaraQuandoApiKeyNaoConfigurada() {
        AsaasClient client = new AsaasClient(
                new AsaasProperties(
                        "",
                        "https://api-sandbox.asaas.com/v3",
                        "SANDBOX",
                        "",
                        10
                ),
                new ObjectMapper()
        );

        assertThatThrownBy(() ->
                client.criarPagamento(
                        new AsaasPaymentRequest(
                                "cus_123",
                                "PIX",
                                BigDecimal.valueOf(89.90),
                                "2026-09-26",
                                "Assinatura",
                                "teste"
                        )
                )
        )
                .isInstanceOf(AsaasException.class)
                .hasMessageContaining("ASAAS_API_KEY");
    }

    @Test
    void leRespostaRealDeCustomerDoSandboxComCamposExtras()
            throws IOException {

        String respostaAsaas = """
                {
                  "object": "customer",
                  "id": "cus_000009245540",
                  "dateCreated": "2026-09-26",
                  "name": "Propriedade teste",
                  "email": null,
                  "company": null,
                  "phone": "0000000000",
                  "mobilePhone": null,
                  "address": null,
                  "addressNumber": null,
                  "complement": null,
                  "province": null,
                  "postalCode": null,
                  "cpfCnpj": "00000000000",
                  "personType": "FISICA",
                  "deleted": false,
                  "additionalEmails": null,
                  "externalReference": "empresa-1",
                  "notificationDisabled": true,
                  "observations": null,
                  "municipalInscription": null,
                  "stateInscription": null,
                  "canDelete": true,
                  "cannotBeDeletedReason": null,
                  "canEdit": true,
                  "cannotEditReason": null,
                  "city": null,
                  "cityName": null,
                  "state": null,
                  "country": "Brasil"
                }
                """;

        AsaasCustomerResponse response =
                new ObjectMapper().readValue(
                        respostaAsaas,
                        AsaasCustomerResponse.class
                );

        assertThat(response.object()).isEqualTo("customer");
        assertThat(response.id()).isEqualTo("cus_000009245540");
        assertThat(response.externalReference()).isEqualTo("empresa-1");
        assertThat(response.email()).isNull();
    }

    @Test
    void aposCriarCustomerConsegueCriarPagamentoPix()
            throws IOException {

        HttpServer server =
                HttpServer.create(new InetSocketAddress(0), 0);
        AtomicBoolean customerRecebido = new AtomicBoolean(false);
        AtomicBoolean pagamentoRecebido = new AtomicBoolean(false);

        server.createContext("/v3/customers", exchange -> {
            customerRecebido.set(true);
            responderJson(exchange, """
                    {
                      "object": "customer",
                      "id": "cus_000009245540",
                      "dateCreated": "2026-09-26",
                      "name": "Propriedade teste",
                      "email": null,
                      "phone": "0000000000",
                      "cpfCnpj": "00000000000",
                      "externalReference": "empresa-1",
                      "notificationDisabled": true,
                      "canDelete": true,
                      "canEdit": true,
                      "country": "Brasil"
                    }
                    """);
        });

        server.createContext("/v3/payments", exchange -> {
            pagamentoRecebido.set(true);
            responderJson(exchange, """
                    {
                      "object": "payment",
                      "id": "pay_123",
                      "status": "PENDING",
                      "billingType": "PIX",
                      "value": 89.90,
                      "dueDate": "2026-09-26",
                      "invoiceUrl": "https://sandbox.asaas.com/i/pay_123",
                      "externalReference": "assinatura-1"
                    }
                    """);
        });

        server.start();

        try {
            AsaasClient client = new AsaasClient(
                    new AsaasProperties(
                            "sandbox-key",
                            "http://localhost:"
                                    + server.getAddress().getPort()
                                    + "/v3",
                            "SANDBOX",
                            "",
                            10
                    ),
                    new ObjectMapper().findAndRegisterModules()
            );

            AsaasCustomerResponse customer =
                    client.criarCliente(
                            new AsaasCustomerRequest(
                                    "Propriedade teste",
                                    "00000000000",
                                    null,
                                    "0000000000",
                                    "88000000",
                                    "Rua Principal",
                                    "123",
                                    null,
                                    "Centro",
                                    "empresa-1",
                                    true,
                                    null
                            )
                    );

            AsaasPaymentResponse pagamento =
                    client.criarPagamento(
                            new AsaasPaymentRequest(
                                    customer.id(),
                                    "PIX",
                                    BigDecimal.valueOf(89.90),
                                    "2026-09-26",
                                    "Assinatura Gestao Agricola",
                                    "assinatura-1"
                            )
                    );

            assertThat(customerRecebido.get()).isTrue();
            assertThat(pagamentoRecebido.get()).isTrue();
            assertThat(customer.id()).isEqualTo("cus_000009245540");
            assertThat(pagamento.id()).isEqualTo("pay_123");
            assertThat(pagamento.billingType()).isEqualTo("PIX");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void criaPagamentoBoletoComBankSlipUrlECamposExtras()
            throws IOException {

        HttpServer server =
                HttpServer.create(new InetSocketAddress(0), 0);
        AtomicBoolean pagamentoRecebido = new AtomicBoolean(false);

        server.createContext("/v3/payments", exchange -> {
            pagamentoRecebido.set(true);
            responderJson(exchange, """
                    {
                      "object": "payment",
                      "id": "pay_boleto_123",
                      "status": "PENDING",
                      "billingType": "BOLETO",
                      "value": 89.90,
                      "dueDate": "2026-09-26",
                      "invoiceUrl": "https://sandbox.asaas.com/i/pay_boleto_123",
                      "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/pay_boleto_123",
                      "externalReference": "assinatura-boleto-1",
                      "extra": "ignorar"
                    }
                    """);
        });

        server.start();

        try {
            AsaasClient client = new AsaasClient(
                    new AsaasProperties(
                            "sandbox-key",
                            "http://localhost:"
                                    + server.getAddress().getPort()
                                    + "/v3",
                            "SANDBOX",
                            "",
                            10
                    ),
                    new ObjectMapper().findAndRegisterModules()
            );

            AsaasPaymentResponse pagamento =
                    client.criarPagamento(
                            new AsaasPaymentRequest(
                                    "cus_000009245540",
                                    "BOLETO",
                                    BigDecimal.valueOf(89.90),
                                    "2026-09-26",
                                    "Assinatura Gestao Agricola",
                                    "assinatura-boleto-1"
                            )
                    );

            assertThat(pagamentoRecebido.get()).isTrue();
            assertThat(pagamento.id()).isEqualTo("pay_boleto_123");
            assertThat(pagamento.billingType()).isEqualTo("BOLETO");
            assertThat(pagamento.bankSlipUrl())
                    .isEqualTo(
                            "https://sandbox.asaas.com/b/pdf/pay_boleto_123"
                    );
        } finally {
            server.stop(0);
        }
    }

    @Test
    void leQrCodePixELinhaDigitavelComCamposExtras()
            throws IOException {

        HttpServer server =
                HttpServer.create(new InetSocketAddress(0), 0);

        server.createContext("/v3/payments/pay_123/pixQrCode", exchange ->
                responderJson(exchange, """
                        {
                          "encodedImage": "base64-do-qrcode",
                          "payload": "pix-copia-e-cola",
                          "expirationDate": "2026-09-29 23:59:59",
                          "extra": "ignorar"
                        }
                        """)
        );

        server.createContext(
                "/v3/payments/pay_123/identificationField",
                exchange -> responderJson(exchange, """
                        {
                          "identificationField": "00190000090301234567890123456789012345678901234",
                          "extra": "ignorar"
                        }
                        """)
        );

        server.start();

        try {
            AsaasClient client = new AsaasClient(
                    new AsaasProperties(
                            "sandbox-key",
                            "http://localhost:"
                                    + server.getAddress().getPort()
                                    + "/v3",
                            "SANDBOX",
                            "",
                            10
                    ),
                    new ObjectMapper().findAndRegisterModules()
            );

            AsaasPixQrCodeResponse pix =
                    client.buscarPixQrCode("pay_123");
            AsaasBoletoLinhaResponse boleto =
                    client.buscarLinhaDigitavel("pay_123");

            assertThat(pix.encodedImage()).isEqualTo("base64-do-qrcode");
            assertThat(pix.payload()).isEqualTo("pix-copia-e-cola");
            assertThat(pix.expirationDate())
                    .isEqualTo("2026-09-29 23:59:59");
            assertThat(boleto.identificationField())
                    .isEqualTo(
                            "00190000090301234567890123456789012345678901234"
                    );
        } finally {
            server.stop(0);
        }
    }

    @Test
    void enviaHeadersOficiaisEmPostPutEGet() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        var chamadas = new java.util.concurrent.CopyOnWriteArrayList<java.util.List<String>>();
        server.createContext("/v3/", exchange -> {
            chamadas.add(java.util.List.of(exchange.getRequestMethod(),
                    exchange.getRequestHeaders().getFirst("User-Agent"),
                    exchange.getRequestHeaders().getFirst("access_token"),
                    exchange.getRequestURI().getPath()));
            responderJson(exchange, "{\"id\":\"cus_teste\",\"encodedImage\":\"qr\",\"payload\":\"pix\"}");
        });
        server.start();
        try {
            AsaasClient client = new AsaasClient(new AsaasProperties(" chave-teste ",
                    "http://localhost:" + server.getAddress().getPort() + "/v3", "SANDBOX", "", 10), new ObjectMapper());
            var request = new AsaasCustomerRequest("Teste", "52998224725", null, null,
                    "88813600", "Rua", "S/N", null, "Bairro", "empresa-1", true, null);
            client.criarCliente(request);
            client.atualizarCliente("cus_teste", request);
            client.buscarPixQrCode("pay_teste");
            assertThat(chamadas).hasSize(3);
            assertThat(chamadas).allSatisfy(c -> {
                assertThat(c.get(1)).isEqualTo("AgroGestao/1.0");
                assertThat(c.get(2)).isEqualTo("chave-teste");
            });
            assertThat(chamadas.get(0).get(0)).isEqualTo("POST");
            assertThat(chamadas.get(1).get(0)).isEqualTo("PUT");
            assertThat(chamadas.get(1).get(3)).isEqualTo("/v3/customers/cus_teste");
            assertThat(chamadas.get(2).get(0)).isEqualTo("GET");
        } finally { server.stop(0); }
    }

    private static void responderJson(
            com.sun.net.httpserver.HttpExchange exchange,
            String json) throws IOException {

        byte[] corpo = json.getBytes();
        exchange.getResponseHeaders()
                .add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, corpo.length);
        exchange.getResponseBody().write(corpo);
        exchange.close();
    }
}
