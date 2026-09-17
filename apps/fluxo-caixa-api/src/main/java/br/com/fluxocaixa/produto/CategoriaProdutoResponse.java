package br.com.fluxocaixa.produto;

public record CategoriaProdutoResponse(
        Long id,
        String nome,
        boolean ativo
) {
    public static CategoriaProdutoResponse de(
            CategoriaProduto categoria) {

        return new CategoriaProdutoResponse(
                categoria.getId(),
                categoria.getNome(),
                categoria.isAtivo()
        );
    }
}
