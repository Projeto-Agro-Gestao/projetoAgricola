package br.com.fluxocaixa.relatorio;

import br.com.fluxocaixa.contafinanceira.ContaFinanceiraResponse;
import br.com.fluxocaixa.contafinanceira.ContaFinanceiraService;
import br.com.fluxocaixa.contafinanceira.ProjecaoDiariaContaResponse;
import br.com.fluxocaixa.contafinanceira.ResumoContasFinanceirasResponse;
import br.com.fluxocaixa.contafinanceira.TipoContaFinanceira;
import br.com.fluxocaixa.dashboard.DashboardService;
import br.com.fluxocaixa.dashboard.PontoFluxoCaixaResponse;
import br.com.fluxocaixa.dashboard.ResumoFinanceiroResponse;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.empresa.EmpresaResponse;
import br.com.fluxocaixa.movimentacao.MovimentacaoResponse;
import br.com.fluxocaixa.movimentacao.MovimentacaoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RelatorioGerencialService {

    private final EmpresaRepository empresaRepository;
    private final DashboardService dashboardService;
    private final ContaFinanceiraService contaFinanceiraService;
    private final MovimentacaoService movimentacaoService;

    public RelatorioGerencialService(
            EmpresaRepository empresaRepository,
            DashboardService dashboardService,
            ContaFinanceiraService contaFinanceiraService,
            MovimentacaoService movimentacaoService) {

        this.empresaRepository = empresaRepository;
        this.dashboardService = dashboardService;
        this.contaFinanceiraService = contaFinanceiraService;
        this.movimentacaoService = movimentacaoService;
    }

    @Transactional(readOnly = true)
    public DadosRelatorioGerencial gerarDados(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        Empresa empresa = empresaRepository
                .findById(empresaId)
                .orElseThrow(
                        () -> new EmpresaNaoEncontradaException(
                                empresaId
                        )
                );

        ResumoFinanceiroResponse resumoRealizado =
                dashboardService.obterResumo(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        List<PontoFluxoCaixaResponse> fluxoCaixa =
                dashboardService.obterFluxoCaixa(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        ResumoContasFinanceirasResponse resumoContas =
                contaFinanceiraService.resumir(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        List<ProjecaoDiariaContaResponse> projecaoFinanceira =
                contaFinanceiraService.buscarProjecaoDiaria(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        List<MovimentacaoResponse> movimentacoes =
                movimentacaoService.listarParaExportacao(
                        empresaId,
                        dataInicial,
                        dataFinal,
                        null,
                        null
                );

        List<ContaFinanceiraResponse> contasAReceber =
                contaFinanceiraService.listar(
                                empresaId,
                                TipoContaFinanceira.RECEBER,
                                null
                        )
                        .stream()
                        .filter(
                                conta ->
                                        estaDentroDoPeriodo(
                                                conta,
                                                dataInicial,
                                                dataFinal
                                        )
                        )
                        .toList();

        List<ContaFinanceiraResponse> contasAPagar =
                contaFinanceiraService.listar(
                                empresaId,
                                TipoContaFinanceira.PAGAR,
                                null
                        )
                        .stream()
                        .filter(
                                conta ->
                                        estaDentroDoPeriodo(
                                                conta,
                                                dataInicial,
                                                dataFinal
                                        )
                        )
                        .toList();

        return new DadosRelatorioGerencial(
                EmpresaResponse.de(empresa),
                dataInicial,
                dataFinal,
                resumoRealizado,
                resumoContas,
                fluxoCaixa,
                projecaoFinanceira,
                movimentacoes,
                contasAReceber,
                contasAPagar
        );
    }

    private boolean estaDentroDoPeriodo(
            ContaFinanceiraResponse conta,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        LocalDate vencimento =
                conta.dataVencimento();

        return !vencimento.isBefore(dataInicial)
                && !vencimento.isAfter(dataFinal);
    }
}