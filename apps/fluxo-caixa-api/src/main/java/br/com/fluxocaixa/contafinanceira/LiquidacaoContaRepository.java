package br.com.fluxocaixa.contafinanceira;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiquidacaoContaRepository
        extends JpaRepository<LiquidacaoConta, Long> {

    List<LiquidacaoConta>
    findAllByContaFinanceira_IdOrderByDataLiquidacaoDesc(
            Long contaFinanceiraId
    );

    List<LiquidacaoConta>
    findAllByContaFinanceira_IdAndContaFinanceira_Empresa_IdOrderByDataLiquidacaoDesc(
            Long contaFinanceiraId,
            Long empresaId
    );

    boolean existsByMovimentacao_Id(
            Long movimentacaoId
    );
}