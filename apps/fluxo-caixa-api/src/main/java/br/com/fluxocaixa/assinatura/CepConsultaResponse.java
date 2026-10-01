package br.com.fluxocaixa.assinatura;

public record CepConsultaResponse(
        String cep,
        String logradouro,
        String bairro,
        String cidade,
        String uf,
        String provider,
        String mensagem) {
}
