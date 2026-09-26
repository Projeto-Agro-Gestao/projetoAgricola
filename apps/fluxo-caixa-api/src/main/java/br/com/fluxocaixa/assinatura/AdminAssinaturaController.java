package br.com.fluxocaixa.assinatura;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/assinaturas")
public class AdminAssinaturaController {

    private final AssinaturaService assinaturaService;

    public AdminAssinaturaController(
            AssinaturaService assinaturaService) {

        this.assinaturaService = assinaturaService;
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
}
