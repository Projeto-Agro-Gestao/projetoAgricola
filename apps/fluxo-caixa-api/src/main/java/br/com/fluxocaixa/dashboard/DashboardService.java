package br.com.fluxocaixa.dashboard;

import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.categoria.AreaCategoria;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.PeriodoInvalidoException;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final BigDecimal CEM =
            new BigDecimal("100");

    private static final BigDecimal ZERO =
            new BigDecimal("0.00");

    private final MovimentacaoRepository movimentacaoRepository;
    private final EmpresaRepository empresaRepository;

    public DashboardService(
            MovimentacaoRepository movimentacaoRepository,
            EmpresaRepository empresaRepository) {

        this.movimentacaoRepository =
                movimentacaoRepository;

        this.empresaRepository =
                empresaRepository;
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroResponse obterResumo(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        return obterResumo(
                empresaId,
                dataInicial,
                dataFinal,
                null
        );
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroResponse obterResumo(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            AreaCategoria area) {

        verificarEmpresa(empresaId);
        verificarPeriodo(dataInicial, dataFinal);

        BigDecimal totalEntrou = obterTotal(
                empresaId,
                TipoMovimentacao.RECEITA,
                dataInicial,
                dataFinal,
                area
        );

        BigDecimal totalSaiu = obterTotal(
                empresaId,
                TipoMovimentacao.DESPESA,
                dataInicial,
                dataFinal,
                area
        );

        BigDecimal quantoSobrou =
                totalEntrou.subtract(totalSaiu);

        BigDecimal margemLucro =
                calcularMargemLucro(
                        quantoSobrou,
                        totalEntrou
                );

        BigDecimal ganhoSobreCusto =
                calcularGanhoSobreCusto(
                        quantoSobrou,
                        totalSaiu
                );

        return new ResumoFinanceiroResponse(
                dataInicial,
                dataFinal,
                totalEntrou,
                totalSaiu,
                quantoSobrou,
                margemLucro,
                ganhoSobreCusto
        );
    }

    @Transactional(readOnly = true)
    public List<PontoFluxoCaixaResponse>
    obterFluxoCaixa(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        return obterFluxoCaixa(
                empresaId,
                dataInicial,
                dataFinal,
                null
        );
    }

    @Transactional(readOnly = true)
    public List<PontoFluxoCaixaResponse>
    obterFluxoCaixa(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            AreaCategoria area) {

        verificarEmpresa(empresaId);
        verificarPeriodo(dataInicial, dataFinal);

        List<TotalDiarioMovimentacaoProjection>
                totaisEncontrados =
                movimentacaoRepository
                        .somarTotaisDiariosPorPeriodoEArea(
                                empresaId,
                                dataInicial,
                                dataFinal,
                                area
                        );

        Map<LocalDate, BigDecimal> receitasPorData =
                new HashMap<>();

        Map<LocalDate, BigDecimal> despesasPorData =
                new HashMap<>();

        for (
                TotalDiarioMovimentacaoProjection total
                : totaisEncontrados
        ) {

            BigDecimal valor =
                    normalizarValor(total.getTotal());

            if (
                    total.getTipo()
                            == TipoMovimentacao.RECEITA
            ) {
                receitasPorData.put(
                        total.getData(),
                        valor
                );
            } else if (
                    total.getTipo()
                            == TipoMovimentacao.DESPESA
            ) {
                despesasPorData.put(
                        total.getData(),
                        valor
                );
            }
        }

        List<PontoFluxoCaixaResponse> pontos =
                new ArrayList<>();

        LocalDate dataAtual = dataInicial;

        while (!dataAtual.isAfter(dataFinal)) {

            BigDecimal totalReceitas =
                    receitasPorData.getOrDefault(
                            dataAtual,
                            ZERO
                    );

            BigDecimal totalDespesas =
                    despesasPorData.getOrDefault(
                            dataAtual,
                            ZERO
                    );

            BigDecimal saldoDoDia =
                    totalReceitas.subtract(
                            totalDespesas
                    );

            pontos.add(
                    new PontoFluxoCaixaResponse(
                            dataAtual,
                            totalReceitas,
                            totalDespesas,
                            saldoDoDia
                    )
            );

            dataAtual = dataAtual.plusDays(1);
        }

        return List.copyOf(pontos);
    }

    private void verificarEmpresa(Long empresaId) {

        if (!empresaRepository.existsById(empresaId)) {
            throw new EmpresaNaoEncontradaException(
                    empresaId
            );
        }
    }

    private void verificarPeriodo(
            LocalDate dataInicial,
            LocalDate dataFinal) {

        if (
                dataInicial == null
                        || dataFinal == null
                        || dataInicial.isAfter(dataFinal)
        ) {
            throw new PeriodoInvalidoException();
        }
    }

    private BigDecimal obterTotal(
            Long empresaId,
            TipoMovimentacao tipo,
            LocalDate dataInicial,
            LocalDate dataFinal,
            AreaCategoria area) {

        BigDecimal total =
                movimentacaoRepository
                        .somarPorTipoEPeriodoEArea(
                                empresaId,
                                tipo,
                                dataInicial,
                                dataFinal,
                                area
                        );

        return normalizarValor(total);
    }

    private BigDecimal normalizarValor(
            BigDecimal valor) {

        if (valor == null) {
            return ZERO;
        }

        return valor.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private BigDecimal calcularMargemLucro(
            BigDecimal quantoSobrou,
            BigDecimal totalEntrou) {

        if (totalEntrou.signum() == 0) {
            return null;
        }

        return quantoSobrou
                .multiply(CEM)
                .divide(
                        totalEntrou,
                        2,
                        RoundingMode.HALF_UP
                );
    }

    private BigDecimal calcularGanhoSobreCusto(
            BigDecimal quantoSobrou,
            BigDecimal totalSaiu) {

        if (totalSaiu.signum() == 0) {
            return null;
        }

        return quantoSobrou
                .multiply(CEM)
                .divide(
                        totalSaiu,
                        2,
                        RoundingMode.HALF_UP
                );
    }
}
