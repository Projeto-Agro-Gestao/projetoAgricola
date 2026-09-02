package br.com.fluxocaixa.dashboard;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(
            DashboardService dashboardService) {

        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<ResumoFinanceiroResponse>
    obterResumo(
            @PathVariable
            Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate dataFinal) {

        LocalDate hoje = LocalDate.now();

        LocalDate inicio =
                dataInicial != null
                        ? dataInicial
                        : hoje.withDayOfMonth(1);

        LocalDate fim =
                dataFinal != null
                        ? dataFinal
                        : hoje;

        ResumoFinanceiroResponse resumo =
                dashboardService.obterResumo(
                        empresaId,
                        inicio,
                        fim
                );

        return ResponseEntity.ok(resumo);
    }

    @GetMapping("/fluxo-caixa")
    public ResponseEntity<List<PontoFluxoCaixaResponse>>
    obterFluxoCaixa(
            @PathVariable
            Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate dataFinal) {

        LocalDate hoje = LocalDate.now();

        LocalDate fim =
                dataFinal != null
                        ? dataFinal
                        : hoje;

        LocalDate inicio =
                dataInicial != null
                        ? dataInicial
                        : fim.minusDays(29);

        List<PontoFluxoCaixaResponse> pontos =
                dashboardService.obterFluxoCaixa(
                        empresaId,
                        inicio,
                        fim
                );

        return ResponseEntity.ok(pontos);
    }
}