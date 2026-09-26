package br.com.fluxocaixa.assinatura;

import jakarta.validation.constraints.NotBlank;

public record AtualizarDocumentoPagamentoRequest(
        @NotBlank(message = "Escolha CPF ou CNPJ")
        String tipoDocumento,

        @NotBlank(message = "Informe o numero do documento")
        String documento
) {
}
