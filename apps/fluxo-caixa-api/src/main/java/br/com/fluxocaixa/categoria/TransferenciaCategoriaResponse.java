package br.com.fluxocaixa.categoria;

public record TransferenciaCategoriaResponse(

        Long categoriaExcluidaId,
        Long categoriaDestinoId,
        int movimentacoesTransferidas,
        String mensagem

) {
}