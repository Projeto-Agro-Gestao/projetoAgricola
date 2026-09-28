package br.com.fluxocaixa.colaboracao;

public record ClassificacaoSugestaoResponse(
        Long categoriaId,
        String categoriaNome,
        String motivo,
        int confianca
) {
}
