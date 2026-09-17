package br.com.fluxocaixa.movimentacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MovimentacaoResponse(

        Long id,
        Long empresaId,
        Long categoriaId,
        String categoriaNome,
        String descricao,
        BigDecimal valor,
        TipoMovimentacao tipo,
        String explicacao,
        LocalDate dataMovimentacao,
        String observacao,
        Long fornecedorId,
        String fornecedorNome,
        String compradorNome,
        boolean excluida,
        LocalDateTime excluidaEm,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static MovimentacaoResponse de(
            Movimentacao movimentacao) {

        return new MovimentacaoResponse(
                movimentacao.getId(),
                movimentacao.getEmpresa().getId(),
                movimentacao.getCategoria() == null
                        ? null
                        : movimentacao.getCategoria().getId(),
                movimentacao.getCategoria() == null
                        ? movimentacao.getCategoriaOriginalNome()
                        : movimentacao.getCategoria().getNome(),
                movimentacao.getDescricao(),
                movimentacao.getValor(),
                movimentacao.getTipo(),
                movimentacao.getTipo().getDescricao(),
                movimentacao.getDataMovimentacao(),
                movimentacao.getObservacao(),
                movimentacao.getFornecedor() == null
                        ? null
                        : movimentacao.getFornecedor().getId(),
                movimentacao.getFornecedorNome(),
                movimentacao.getCompradorNome(),
                movimentacao.isExcluida(),
                movimentacao.getExcluidaEm(),
                movimentacao.getCriadoEm(),
                movimentacao.getAtualizadoEm()
        );
    }
}
