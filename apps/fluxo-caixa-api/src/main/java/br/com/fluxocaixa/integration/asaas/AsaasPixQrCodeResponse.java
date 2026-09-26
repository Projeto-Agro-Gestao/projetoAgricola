package br.com.fluxocaixa.integration.asaas;

import java.time.LocalDateTime;

public record AsaasPixQrCodeResponse(
        String encodedImage,
        String payload,
        LocalDateTime expirationDate
) {
}
