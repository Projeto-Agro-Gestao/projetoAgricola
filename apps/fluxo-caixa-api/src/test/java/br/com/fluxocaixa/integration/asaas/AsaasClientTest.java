package br.com.fluxocaixa.integration.asaas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

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
                                LocalDate.now(),
                                "Assinatura",
                                "teste"
                        )
                )
        )
                .isInstanceOf(AsaasException.class)
                .hasMessageContaining("ASAAS_API_KEY");
    }
}
