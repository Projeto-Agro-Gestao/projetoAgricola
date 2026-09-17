package br.com.fluxocaixa.fornecedor;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/fornecedores")
public class FornecedorController {

    private final FornecedorService fornecedorService;

    public FornecedorController(
            FornecedorService fornecedorService) {

        this.fornecedorService = fornecedorService;
    }

    @PostMapping
    public ResponseEntity<FornecedorResponse> criar(
            @PathVariable Long empresaId,
            @Valid @RequestBody
            CriarFornecedorRequest request) {

        FornecedorResponse fornecedor =
                fornecedorService.criar(
                        empresaId,
                        request
                );

        URI localizacao = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{fornecedorId}")
                .buildAndExpand(fornecedor.id())
                .toUri();

        return ResponseEntity
                .created(localizacao)
                .body(fornecedor);
    }

    @GetMapping
    public ResponseEntity<List<FornecedorResponse>> listar(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                fornecedorService.listar(empresaId)
        );
    }

    @GetMapping("/lixeira")
    public ResponseEntity<List<FornecedorResponse>> listarLixeira(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                fornecedorService.listarLixeira(empresaId)
        );
    }

    @GetMapping("/{fornecedorId}/compras")
    public ResponseEntity<List<CompraFornecedorResponse>> listarCompras(
            @PathVariable Long empresaId,
            @PathVariable Long fornecedorId) {

        return ResponseEntity.ok(
                fornecedorService.listarCompras(
                        empresaId,
                        fornecedorId
                )
        );
    }

    @GetMapping("/comparativo-produtos")
    public ResponseEntity<List<ComparativoProdutoFornecedorResponse>>
    compararProdutos(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                fornecedorService.compararProdutos(empresaId)
        );
    }

    @PutMapping("/{fornecedorId}")
    public ResponseEntity<FornecedorResponse> atualizar(
            @PathVariable Long empresaId,
            @PathVariable Long fornecedorId,
            @Valid @RequestBody
            AtualizarFornecedorRequest request) {

        return ResponseEntity.ok(
                fornecedorService.atualizar(
                        empresaId,
                        fornecedorId,
                        request
                )
        );
    }

    @DeleteMapping("/{fornecedorId}")
    public ResponseEntity<FornecedorResponse> moverParaLixeira(
            @PathVariable Long empresaId,
            @PathVariable Long fornecedorId) {

        return ResponseEntity.ok(
                fornecedorService.moverParaLixeira(
                        empresaId,
                        fornecedorId
                )
        );
    }

    @PatchMapping("/{fornecedorId}/restaurar")
    public ResponseEntity<FornecedorResponse> restaurar(
            @PathVariable Long empresaId,
            @PathVariable Long fornecedorId) {

        return ResponseEntity.ok(
                fornecedorService.restaurar(
                        empresaId,
                        fornecedorId
                )
        );
    }

    @DeleteMapping("/{fornecedorId}/permanente")
    public ResponseEntity<Void> excluirPermanentemente(
            @PathVariable Long empresaId,
            @PathVariable Long fornecedorId) {

        fornecedorService.excluirPermanentemente(
                empresaId,
                fornecedorId
        );

        return ResponseEntity.noContent().build();
    }
}
