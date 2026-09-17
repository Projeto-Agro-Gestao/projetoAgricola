package br.com.fluxocaixa.produto;

import java.math.BigDecimal;

public record ProdutoResponse(
        Long id,
        Long categoriaId,
        String categoriaNome,
        String nome,
        String unidadeBase,
        BigDecimal pesoPadraoKg,
        boolean ativo
) {
    public static ProdutoResponse de(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getCategoria().getId(),
                produto.getCategoria().getNome(),
                produto.getNome(),
                produto.getUnidadeBase(),
                produto.getPesoPadraoKg(),
                produto.isAtivo()
        );
    }
}
