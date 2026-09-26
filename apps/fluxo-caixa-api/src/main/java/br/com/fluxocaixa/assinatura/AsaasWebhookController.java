package br.com.fluxocaixa.assinatura;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks/asaas")
public class AsaasWebhookController {

    private final AsaasWebhookService webhookService;

    public AsaasWebhookController(
            AsaasWebhookService webhookService) {

        this.webhookService = webhookService;
    }

    @PostMapping
    public ResponseEntity<Void> receber(
            @RequestHeader(
                    value = "asaas-access-token",
                    required = false
            )
            String token,
            @RequestBody String payload) {

        webhookService.processar(token, payload);
        return ResponseEntity.ok().build();
    }
}
