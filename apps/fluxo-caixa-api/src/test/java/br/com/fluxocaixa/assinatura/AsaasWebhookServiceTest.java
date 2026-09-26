package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.integration.asaas.AsaasProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AsaasWebhookServiceTest {

    private final AsaasWebhookEventoRepository eventoRepository =
            mock(AsaasWebhookEventoRepository.class);

    private final AssinaturaService assinaturaService =
            mock(AssinaturaService.class);

    private final AsaasWebhookService service =
            new AsaasWebhookService(
                    eventoRepository,
                    assinaturaService,
                    new AsaasProperties(
                            "",
                            "https://api-sandbox.asaas.com/v3",
                            "SANDBOX",
                            "token-webhook",
                            10
                    ),
                    new ObjectMapper()
            );

    @Test
    void webhookRepetidoNaoConfirmaPagamentoNovamente() {
        String payload = """
                {
                  "event": "PAYMENT_CONFIRMED",
                  "payment": {
                    "id": "pay_123",
                    "status": "CONFIRMED",
                    "confirmedDate": "2026-09-26"
                  }
                }
                """;

        when(eventoRepository.existsByChaveEvento(
                "PAYMENT_CONFIRMED:pay_123:CONFIRMED"
        )).thenReturn(true);

        service.processar("token-webhook", payload);

        verify(assinaturaService, never())
                .confirmarPagamento(any(), any(), eq(false));
    }
}
