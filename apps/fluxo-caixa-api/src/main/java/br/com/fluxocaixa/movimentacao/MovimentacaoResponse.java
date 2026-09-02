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
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static MovimentacaoResponse de(
            Movimentacao movimentacao) {

        return new MovimentacaoResponse(
                movimentacao.getId(),
                movimentacao.getEmpresa().getId(),
                movimentacao.getCategoria().getId(),
                movimentacao.getCategoria().getNome(),
                movimentacao.getDescricao(),
                movimentacao.getValor(),
                movimentacao.getTipo(),
                movimentacao.getTipo().getDescricao(),
                movimentacao.getDataMovimentacao(),
                movimentacao.getObservacao(),
                movimentacao.getCriadoEm(),
                movimentacao.getAtualizadoEm()
        );
    }
}