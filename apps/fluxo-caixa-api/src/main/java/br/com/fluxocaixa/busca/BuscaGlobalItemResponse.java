package br.com.fluxocaixa.busca;

public record BuscaGlobalItemResponse(
        String tipo,
        Long id,
        String titulo,
        String descricao,
        String rota
) {
}
