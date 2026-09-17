package br.com.fluxocaixa.fornecedor;

import java.time.LocalDateTime;

public record FornecedorResponse(

        Long id,
        Long empresaId,
        String nome,
        String telefone,
        String observacao,
        boolean excluido,
        LocalDateTime excluidoEm,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static FornecedorResponse de(
            Fornecedor fornecedor) {

        return new FornecedorResponse(
                fornecedor.getId(),
                fornecedor.getEmpresa().getId(),
                fornecedor.getNome(),
                fornecedor.getTelefone(),
                fornecedor.getObservacao(),
                fornecedor.isExcluido(),
                fornecedor.getExcluidoEm(),
                fornecedor.getCriadoEm(),
                fornecedor.getAtualizadoEm()
        );
    }
}
