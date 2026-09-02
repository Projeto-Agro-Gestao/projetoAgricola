package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(
            CategoriaService categoriaService) {

        this.categoriaService = categoriaService;
    }

    @PostMapping
    public ResponseEntity<CategoriaResponse> criar(
            @PathVariable Long empresaId,
            @Valid @RequestBody
            CriarCategoriaRequest request) {

        CategoriaResponse categoria =
                categoriaService.criar(
                        empresaId,
                        request
                );

        URI localizacao = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{categoriaId}")
                .buildAndExpand(categoria.id())
                .toUri();

        return ResponseEntity
                .created(localizacao)
                .body(categoria);
    }

    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar(
            @PathVariable Long empresaId,
            @RequestParam(required = false)
            TipoMovimentacao tipo) {

        List<CategoriaResponse> categorias =
                categoriaService.listar(
                        empresaId,
                        tipo
                );

        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/todas")
    public ResponseEntity<List<CategoriaResponse>>
    listarTodas(
            @PathVariable Long empresaId) {

        List<CategoriaResponse> categorias =
                categoriaService.listarTodas(
                        empresaId
                );

        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/{categoriaId}")
    public ResponseEntity<CategoriaResponse> buscarPorId(
            @PathVariable Long empresaId,
            @PathVariable Long categoriaId) {

        CategoriaResponse categoria =
                categoriaService.buscarPorId(
                        empresaId,
                        categoriaId
                );

        return ResponseEntity.ok(categoria);
    }

    @PutMapping("/{categoriaId}")
    public ResponseEntity<CategoriaResponse> atualizar(
            @PathVariable Long empresaId,
            @PathVariable Long categoriaId,
            @Valid @RequestBody
            AtualizarCategoriaRequest request) {

        CategoriaResponse categoria =
                categoriaService.atualizar(
                        empresaId,
                        categoriaId,
                        request
                );

        return ResponseEntity.ok(categoria);
    }

    @PatchMapping("/{categoriaId}/desativar")
    public ResponseEntity<CategoriaResponse> desativar(
            @PathVariable Long empresaId,
            @PathVariable Long categoriaId) {

        CategoriaResponse categoria =
                categoriaService.desativar(
                        empresaId,
                        categoriaId
                );

        return ResponseEntity.ok(categoria);
    }

    @PatchMapping("/{categoriaId}/ativar")
    public ResponseEntity<CategoriaResponse> ativar(
            @PathVariable Long empresaId,
            @PathVariable Long categoriaId) {

        CategoriaResponse categoria =
                categoriaService.ativar(
                        empresaId,
                        categoriaId
                );

        return ResponseEntity.ok(categoria);
    }

    @DeleteMapping("/{categoriaId}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long empresaId,
            @PathVariable Long categoriaId) {

        categoriaService.excluir(
                empresaId,
                categoriaId
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    @PostMapping(
            "/{categoriaId}/transferir-e-excluir"
    )
    public ResponseEntity<TransferenciaCategoriaResponse>
    transferirMovimentacoesEExcluir(
            @PathVariable Long empresaId,
            @PathVariable Long categoriaId,
            @Valid @RequestBody
            TransferirMovimentacoesCategoriaRequest
                    request) {

        TransferenciaCategoriaResponse resposta =
                categoriaService
                        .transferirMovimentacoesEExcluir(
                                empresaId,
                                categoriaId,
                                request
                        );

        return ResponseEntity.ok(resposta);
    }
}