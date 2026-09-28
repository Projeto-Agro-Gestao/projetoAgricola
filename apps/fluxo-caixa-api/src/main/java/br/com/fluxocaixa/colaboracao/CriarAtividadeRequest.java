package br.com.fluxocaixa.colaboracao;

public record CriarAtividadeRequest(
        String nome,
        TipoAtividadeRural tipo
) {
}
