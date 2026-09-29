package br.com.fluxocaixa.colaboracao;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/contador")
public class ContadorController {

    private final ColaboracaoService colaboracaoService;

    public ContadorController(
            ColaboracaoService colaboracaoService) {

        this.colaboracaoService = colaboracaoService;
    }

    @GetMapping("/clientes")
    public List<ContadorClienteResponse> carteira() {
        return colaboracaoService.carteiraContador();
    }

    @GetMapping("/clientes/{empresaId}/pendencias")
    public List<PendenciaAgroResponse> pendenciasDoCliente(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarPendencias(empresaId);
    }

    @GetMapping("/clientes/{empresaId}/documentos")
    public List<DocumentoAgroResponse> documentosDoCliente(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarDocumentos(empresaId);
    }

    @GetMapping("/clientes/{empresaId}/visao-tributaria")
    public VisaoTributariaResponse visaoTributaria(
            @PathVariable Long empresaId) {

        return colaboracaoService.visaoTributaria(
                empresaId,
                LocalDate.now().getYear()
        );
    }

    @GetMapping("/clientes/{empresaId}/dashboard-contabil")
    public ContadorDashboardFiscalResponse dashboardContabil(
            @PathVariable Long empresaId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        return colaboracaoService.dashboardContabil(
                empresaId,
                dataInicial,
                dataFinal
        );
    }

    @GetMapping("/clientes/{empresaId}/classificacoes-contabeis")
    public List<ClassificacaoContabilResponse> classificacoesContabeis(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarClassificacoesContabeis(empresaId);
    }

    @PostMapping("/clientes/{empresaId}/classificacoes-contabeis")
    public ClassificacaoContabilResponse criarClassificacaoContabil(
            @PathVariable Long empresaId,
            @RequestBody SalvarClassificacaoContabilRequest request) {

        return colaboracaoService.salvarClassificacaoContabil(
                empresaId,
                request
        );
    }

    @GetMapping("/clientes/{empresaId}/analises-fiscais")
    public List<AnaliseFiscalMovimentacaoResponse> analisesFiscais(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarAnalisesFiscais(empresaId);
    }

    @PutMapping("/clientes/{empresaId}/movimentacoes/{movimentacaoId}/analise-fiscal")
    public AnaliseFiscalMovimentacaoResponse atualizarAnaliseFiscal(
            @PathVariable Long empresaId,
            @PathVariable Long movimentacaoId,
            @RequestBody AtualizarAnaliseFiscalRequest request) {

        return colaboracaoService.atualizarAnaliseFiscal(
                empresaId,
                movimentacaoId,
                request
        );
    }

    @GetMapping("/clientes/{empresaId}/regimes-tributarios")
    public List<RegimeTributarioEmpresaResponse> regimesTributarios(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarRegimesTributarios(empresaId);
    }

    @PostMapping("/clientes/{empresaId}/regimes-tributarios")
    public RegimeTributarioEmpresaResponse criarRegimeTributario(
            @PathVariable Long empresaId,
            @RequestBody SalvarRegimeTributarioRequest request) {

        return colaboracaoService.salvarRegimeTributario(
                empresaId,
                request
        );
    }

    @GetMapping("/clientes/{empresaId}/parametros-tributarios")
    public List<ParametroTributarioResponse> parametrosTributarios(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarParametrosTributarios(empresaId);
    }

    @PostMapping("/clientes/{empresaId}/parametros-tributarios")
    public ParametroTributarioResponse criarParametroTributario(
            @PathVariable Long empresaId,
            @RequestBody SalvarParametroTributarioRequest request) {

        return colaboracaoService.salvarParametroTributario(
                empresaId,
                request
        );
    }

    @GetMapping("/clientes/{empresaId}/simulacao-tributaria")
    public SimulacaoTributariaResponse simulacaoTributaria(
            @PathVariable Long empresaId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        return colaboracaoService.simularTributos(
                empresaId,
                dataInicial,
                dataFinal
        );
    }
}
