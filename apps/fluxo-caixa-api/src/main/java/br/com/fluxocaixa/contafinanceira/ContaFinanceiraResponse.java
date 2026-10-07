package br.com.fluxocaixa.contafinanceira;

import br.com.fluxocaixa.comum.FusoHorario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public record ContaFinanceiraResponse(

        Long id,
        Long empresaId,
        Long categoriaId,
        String categoriaNome,

        String descricao,
        String favorecido,
        String numeroDocumento,

        TipoContaFinanceira tipo,
        String tipoDescricao,
        String tipoExplicacao,

        BigDecimal valorTotal,
        BigDecimal valorLiquidado,
        BigDecimal valorPendente,

        LocalDate dataEmissao,
        LocalDate dataVencimento,
        LocalDate dataLiquidacao,

        SituacaoContaFinanceira situacao,
        String situacaoDescricao,
        String situacaoExplicacao,

        boolean vencida,
        long diasParaVencimento,

        boolean lembreteAtivo,
        int antecedenciaLembreteDias,
        boolean exibirLembrete,

        String observacao,
        Long fornecedorId,
        String fornecedorNome,
        String compradorNome,
        String produtoNome,
        String produtoClassificacao,
        BigDecimal quantidade,
        String unidadeMedida,
        BigDecimal valorUnitario,

        boolean excluida,
        LocalDateTime excluidaEm,
        Long movimentacaoFinanceiroId,

        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static ContaFinanceiraResponse de(
            ContaFinanceira conta) {

        return de(
                conta,
                FusoHorario.hoje()
        );
    }

    public static ContaFinanceiraResponse de(
            ContaFinanceira conta,
            LocalDate dataAtual) {

        long diasParaVencimento =
                ChronoUnit.DAYS.between(
                        dataAtual,
                        conta.getDataVencimento()
                );

        return new ContaFinanceiraResponse(
                conta.getId(),
                conta.getEmpresa().getId(),
                conta.getCategoria() == null
                        ? null
                        : conta.getCategoria().getId(),
                conta.getCategoria() == null
                        ? conta.getCategoriaOriginalNome()
                        : conta.getCategoria().getNome(),

                conta.getDescricao(),
                conta.getFavorecido(),
                conta.getNumeroDocumento(),

                conta.getTipo(),
                conta.getTipo().getDescricao(),
                conta.getTipo().getExplicacao(),

                conta.getValorTotal(),
                conta.getValorLiquidado(),
                conta.getValorPendente(),

                conta.getDataEmissao(),
                conta.getDataVencimento(),
                conta.getDataLiquidacao(),

                conta.getSituacao(),
                conta.getSituacao().getDescricao(),
                conta.getSituacao().getExplicacao(),

                conta.estaVencida(dataAtual),
                diasParaVencimento,

                conta.isLembreteAtivo(),
                conta.getAntecedenciaLembreteDias(),
                conta.deveExibirLembrete(
                        dataAtual
                ),

                conta.getObservacao(),
                conta.getFornecedor() == null
                        ? null
                        : conta.getFornecedor().getId(),
                conta.getFornecedorNome(),
                conta.getCompradorNome(),
                conta.getProdutoNome(),
                conta.getProdutoClassificacao(),
                conta.getQuantidade(),
                conta.getUnidadeMedida(),
                conta.getValorUnitario(),

                conta.isExcluida(),
                conta.getExcluidaEm(),
                conta.getMovimentacaoFinanceiro() == null
                        ? null
                        : conta.getMovimentacaoFinanceiro().getId(),

                conta.getCriadoEm(),
                conta.getAtualizadoEm()
        );
    }
}
