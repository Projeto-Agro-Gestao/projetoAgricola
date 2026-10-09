package br.com.fluxocaixa.busca;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/busca-global")
public class BuscaGlobalController {

    private final BuscaGlobalService buscaGlobalService;

    public BuscaGlobalController(BuscaGlobalService buscaGlobalService) {
        this.buscaGlobalService = buscaGlobalService;
    }

    @GetMapping
    public ResponseEntity<List<BuscaGlobalItemResponse>> buscar(
            @PathVariable Long empresaId,
            @RequestParam(name = "q", required = false) String termo) {
        return ResponseEntity.ok(buscaGlobalService.buscar(empresaId, termo));
    }
}
