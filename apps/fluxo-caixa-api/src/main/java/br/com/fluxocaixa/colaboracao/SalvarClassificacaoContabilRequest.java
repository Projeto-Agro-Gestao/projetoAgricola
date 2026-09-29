package br.com.fluxocaixa.colaboracao;

public record SalvarClassificacaoContabilRequest(
        String nome,
        String descricao,
        Boolean ativa) {
}
