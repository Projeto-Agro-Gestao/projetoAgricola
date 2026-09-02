package br.com.fluxocaixa.empresa;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @PostMapping
    public ResponseEntity<EmpresaResponse> criar(
            @Valid @RequestBody CriarEmpresaRequest request) {

        EmpresaResponse empresa = empresaService.criar(request);

        URI localizacao = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(empresa.id())
                .toUri();

        return ResponseEntity
                .created(localizacao)
                .body(empresa);
    }

    @GetMapping
    public ResponseEntity<List<EmpresaResponse>> listar() {

        List<EmpresaResponse> empresas = empresaService.listar();

        return ResponseEntity.ok(empresas);
    }
}