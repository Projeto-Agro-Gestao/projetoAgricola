package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.integration.asaas.AsaasProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class AsaasWebhookService {

    private final AsaasWebhookEventoRepository eventoRepository;
    private final AssinaturaService assinaturaService;
    private final AsaasProperties properties;
    private final ObjectMapper objectMapper;

    public AsaasWebhookService(
            AsaasWebhookEventoRepository eventoRepository,
            AssinaturaService assinaturaService,
            AsaasProperties properties,
            ObjectMapper objectMapper) {

        this.eventoRepository = eventoRepository;
        this.assinaturaService = assinaturaService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void processar(
            String tokenRecebido,
            String payload) {

        validarToken(tokenRecebido);

        try {
            JsonNode raiz = objectMapper.readTree(payload);
            String evento = raiz.path("event").asText("");
            JsonNode payment = raiz.path("payment");
            String paymentId = payment.path("id").asText("");
            String chaveEvento = montarChaveEvento(
                    raiz,
                    evento,
                    paymentId
            );

            if (eventoRepository.existsByChaveEvento(chaveEvento)) {
                return;
            }

            AsaasWebhookEvento registro =
                    eventoRepository.save(
                            new AsaasWebhookEvento(
                                    chaveEvento,
                                    evento,
                                    paymentId,
                                    payload
                            )
                    );

            if (paymentId.isBlank()) {
                registro.ignorado();
                return;
            }

            switch (evento) {
                case "PAYMENT_CONFIRMED" ->
                        assinaturaService.confirmarPagamento(
                                paymentId,
                                obterDataPagamento(payment),
                                false
                        );
                case "PAYMENT_RECEIVED" ->
                        assinaturaService.confirmarPagamento(
                                paymentId,
                                obterDataPagamento(payment),
                                true
                        );
                case "PAYMENT_OVERDUE" ->
                        assinaturaService.marcarVencido(paymentId);
                case "PAYMENT_DELETED",
                        "PAYMENT_REFUNDED",
                        "PAYMENT_REFUND_DENIED" ->
                        registro.ignorado();
                default -> {
                    registro.ignorado();
                    return;
                }
            }

            registro.processado();
        } catch (Exception exception) {
            String chaveErro =
                    "erro-" + Integer.toHexString(
                            payload.hashCode()
                    );

            if (!eventoRepository.existsByChaveEvento(chaveErro)) {
                AsaasWebhookEvento registro =
                        new AsaasWebhookEvento(
                                chaveErro,
                                "ERRO",
                                null,
                                payload
                        );
                registro.erro(exception.getMessage());
                eventoRepository.save(registro);
            }

            throw new IllegalArgumentException(
                    "Webhook Asaas invalido"
            );
        }
    }

    private void validarToken(String tokenRecebido) {

        String tokenEsperado = properties.webhookToken();

        if (tokenEsperado == null || tokenEsperado.isBlank()) {
            return;
        }

        if (!tokenEsperado.equals(tokenRecebido)) {
            throw new IllegalArgumentException(
                    "Webhook Asaas nao autorizado"
            );
        }
    }

    private String montarChaveEvento(
            JsonNode raiz,
            String evento,
            String paymentId) {

        String id = raiz.path("id").asText("");

        if (!id.isBlank()) {
            return id;
        }

        String status = raiz.path("payment")
                .path("status")
                .asText("");

        return evento + ":" + paymentId + ":" + status;
    }

    private LocalDate obterDataPagamento(JsonNode payment) {

        String data = primeiroTexto(
                payment.path("confirmedDate").asText(null),
                payment.path("paymentDate").asText(null),
                payment.path("clientPaymentDate").asText(null)
        );

        return data == null || data.isBlank()
                ? LocalDate.now()
                : LocalDate.parse(data);
    }

    private String primeiroTexto(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }
}
