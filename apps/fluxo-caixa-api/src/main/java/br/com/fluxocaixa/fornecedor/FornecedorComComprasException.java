package br.com.fluxocaixa.fornecedor;

public class FornecedorComComprasException extends RuntimeException {

    public FornecedorComComprasException(String nomeFornecedor) {
        super(
                "So pode excluir este fornecedor definitivamente "
                        + "apos excluir permanentemente todas as compras "
                        + "e contas ligadas a ele. Fornecedor: \""
                        + nomeFornecedor
                        + "\""
        );
    }
}
