package br.com.fluxocaixa.colaboracao;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
