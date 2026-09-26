package br.com.fluxocaixa.assinatura;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/assinatura")
public class AssinaturaController {

    private final AssinaturaService assinaturaService;

    public AssinaturaController(
            AssinaturaService assinaturaService) {

        this.assinaturaService = assinaturaService;
    }

    @GetMapping
    public ResponseEntity<AssinaturaDetalheResponse> detalhar(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.detalhar(empresaId)
        );
    }

    @PostMapping("/pagamentos/pix")
    public ResponseEntity<AssinaturaPagamentoResponse> criarPix(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.criarPix(empresaId)
        );
    }

    @PostMapping("/pagamentos/boleto")
    public ResponseEntity<AssinaturaPagamentoResponse> criarBoleto(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.criarBoleto(empresaId)
        );
    }
}
