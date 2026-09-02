package br.com.fluxocaixa.relatorio;

import br.com.fluxocaixa.contafinanceira.ContaFinanceiraResponse;
import br.com.fluxocaixa.contafinanceira.ProjecaoDiariaContaResponse;
import br.com.fluxocaixa.contafinanceira.ResumoContasFinanceirasResponse;
import br.com.fluxocaixa.dashboard.PontoFluxoCaixaResponse;
import br.com.fluxocaixa.dashboard.ResumoFinanceiroResponse;
import br.com.fluxocaixa.empresa.EmpresaResponse;
import br.com.fluxocaixa.movimentacao.MovimentacaoResponse;

import java.time.LocalDate;
import java.util.List;

public record DadosRelatorioGerencial(

        EmpresaResponse empresa,

        LocalDate dataInicial,
        LocalDate dataFinal,

        ResumoFinanceiroResponse resumoRealizado,

        ResumoContasFinanceirasResponse resumoContas,

        List<PontoFluxoCaixaResponse> fluxoCaixa,

        List<ProjecaoDiariaContaResponse> projecaoFinanceira,

        List<MovimentacaoResponse> movimentacoes,

        List<ContaFinanceiraResponse> contasAReceber,

        List<ContaFinanceiraResponse> contasAPagar

) {
}