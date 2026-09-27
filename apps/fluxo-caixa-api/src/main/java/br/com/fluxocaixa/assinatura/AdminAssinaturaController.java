package br.com.fluxocaixa.assinatura;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/assinaturas")
public class AdminAssinaturaController {

    private final AssinaturaService assinaturaService;
    private final NotaFiscalService notaFiscalService;

    public AdminAssinaturaController(
            AssinaturaService assinaturaService,
            NotaFiscalService notaFiscalService) {

        this.assinaturaService = assinaturaService;
        this.notaFiscalService = notaFiscalService;
    }

    @GetMapping
    public ResponseEntity<AssinaturaAdminResponse> listar() {
        return ResponseEntity.ok(
                assinaturaService.listarAdmin()
        );
    }

    @PutMapping("/configuracao")
    public ResponseEntity<AssinaturaConfiguracaoResponse>
    atualizarConfiguracao(
            @Valid @RequestBody
            AtualizarAssinaturaConfiguracaoRequest request) {

        return ResponseEntity.ok(
                assinaturaService.atualizarConfiguracao(request)
        );
    }

    @PatchMapping("/empresas/{empresaId}/trial/adicionar-dias")
    public ResponseEntity<AssinaturaResumoResponse> adicionarDiasTrial(
            @PathVariable Long empresaId,
            @Valid @RequestBody AjustarTrialRequest request) {

        return ResponseEntity.ok(
                assinaturaService.adicionarDiasTrial(
                        empresaId,
                        request
                )
        );
    }

    @PatchMapping("/empresas/{empresaId}/trial/definir-fim")
    public ResponseEntity<AssinaturaResumoResponse> definirFimTrial(
            @PathVariable Long empresaId,
            @Valid @RequestBody AjustarTrialRequest request) {

        return ResponseEntity.ok(
                assinaturaService.definirFimTrial(
                        empresaId,
                        request
                )
        );
    }

    @PatchMapping("/empresas/{empresaId}/trial/encerrar")
    public ResponseEntity<AssinaturaResumoResponse> encerrarTrial(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.encerrarTrial(empresaId)
        );
    }

    @PatchMapping("/empresas/{empresaId}/status")
    public ResponseEntity<AssinaturaResumoResponse> alterarStatus(
            @PathVariable Long empresaId,
            @Valid @RequestBody
            AtualizarStatusAssinaturaRequest request) {

        return ResponseEntity.ok(
                assinaturaService.alterarStatusManual(
                        empresaId,
                        request
                )
        );
    }

    @PatchMapping("/empresas/{empresaId}/desativar")
    public ResponseEntity<AssinaturaResumoResponse> desativarCliente(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.desativarCliente(empresaId)
        );
    }

    @PatchMapping("/empresas/{empresaId}/restaurar")
    public ResponseEntity<AssinaturaResumoResponse> restaurarCliente(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.restaurarCliente(empresaId)
        );
    }

    @GetMapping("/empresas/{empresaId}/notas-fiscais")
    public ResponseEntity<java.util.List<NotaFiscalResponse>> listarNotas(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                notaFiscalService.listarPorEmpresa(empresaId)
        );
    }

    @PostMapping("/empresas/{empresaId}/pagamentos/{pagamentoId}/nota-fiscal")
    public ResponseEntity<NotaFiscalResponse> emitirNotaFiscal(
            @PathVariable Long empresaId,
            @PathVariable Long pagamentoId) {

        return ResponseEntity.ok(
                notaFiscalService.emitir(empresaId, pagamentoId)
        );
    }

    @PostMapping("/empresas/{empresaId}/notas-fiscais/{notaFiscalId}/consultar")
    public ResponseEntity<NotaFiscalResponse> consultarNotaFiscal(
            @PathVariable Long empresaId,
            @PathVariable Long notaFiscalId) {

        return ResponseEntity.ok(
                notaFiscalService.consultarStatus(
                        empresaId,
                        notaFiscalId
                )
        );
    }
}
