package br.com.fluxocaixa.assinatura;

import jakarta.validation.constraints.NotBlank;

public record AtualizarDocumentoPagamentoRequest(
        @NotBlank(message = "Escolha CPF ou CNPJ")
        String tipoDocumento,

        @NotBlank(message = "Informe o numero do documento")
        String documento,

        @NotBlank(message = "Informe o CEP")
        String cep,

        @NotBlank(message = "Informe a rua")
        String rua,

        @NotBlank(message = "Informe o numero")
        String numero,

        @NotBlank(message = "Informe o bairro")
        String bairro,

        @NotBlank(message = "Informe a cidade")
        String cidade,

        @NotBlank(message = "Informe o estado")
        String estado,

        String telefone,

        String email
) {
}
