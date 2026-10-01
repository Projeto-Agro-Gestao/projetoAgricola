package br.com.fluxocaixa.assinatura;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/assinatura")
public class AssinaturaController {

    private final AssinaturaService assinaturaService;
    private final NotaFiscalService notaFiscalService;
    private final CepLookupService cepLookupService;

    public AssinaturaController(
            AssinaturaService assinaturaService,
            NotaFiscalService notaFiscalService,
            CepLookupService cepLookupService) {

        this.assinaturaService = assinaturaService;
        this.notaFiscalService = notaFiscalService;
        this.cepLookupService = cepLookupService;
    }

    @GetMapping
    public ResponseEntity<AssinaturaDetalheResponse> detalhar(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                assinaturaService.detalhar(empresaId)
        );
    }

    @PutMapping("/documento-pagamento")
    public ResponseEntity<AssinaturaDetalheResponse> atualizarDocumentoPagamento(
            @PathVariable Long empresaId,
            @RequestBody @Valid AtualizarDocumentoPagamentoRequest request) {

        return ResponseEntity.ok(
                assinaturaService.atualizarDocumentoPagamento(
                        empresaId,
                        request
                )
        );
    }

    @GetMapping("/cep/{cep}")
    public ResponseEntity<CepConsultaResponse> consultarCep(
            @PathVariable String cep) {

        return ResponseEntity.ok(
                cepLookupService.consultar(cep)
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

    @GetMapping("/notas-fiscais")
    public ResponseEntity<java.util.List<NotaFiscalResponse>> listarNotas(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                notaFiscalService.listarPorEmpresa(empresaId)
        );
    }

    @PostMapping("/pagamentos/{pagamentoId}/nota-fiscal")
    public ResponseEntity<NotaFiscalResponse> emitirNotaFiscal(
            @PathVariable Long empresaId,
            @PathVariable Long pagamentoId) {

        return ResponseEntity.ok(
                notaFiscalService.emitir(empresaId, pagamentoId)
        );
    }

    @GetMapping("/notas-fiscais/{notaFiscalId}")
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
