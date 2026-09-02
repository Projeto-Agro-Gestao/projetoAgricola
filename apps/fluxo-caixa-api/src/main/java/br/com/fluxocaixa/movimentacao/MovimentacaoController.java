package br.com.fluxocaixa.movimentacao;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/movimentacoes")
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;

    public MovimentacaoController(
            MovimentacaoService movimentacaoService) {

        this.movimentacaoService = movimentacaoService;
    }

    @PostMapping
    public ResponseEntity<MovimentacaoResponse> criar(
            @PathVariable Long empresaId,
            @Valid @RequestBody CriarMovimentacaoRequest request) {

        MovimentacaoResponse movimentacao =
                movimentacaoService.criar(empresaId, request);

        URI localizacao = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{movimentacaoId}")
                .buildAndExpand(movimentacao.id())
                .toUri();

        return ResponseEntity
                .created(localizacao)
                .body(movimentacao);
    }

    @GetMapping
    public ResponseEntity<Page<MovimentacaoResponse>> listar(
            @PathVariable Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal,

            @RequestParam(required = false)
            TipoMovimentacao tipo,

            @RequestParam(required = false)
            Long categoriaId,

            @PageableDefault(
                    size = 20,
                    sort = {"dataMovimentacao", "id"},
                    direction = Sort.Direction.DESC
            )
            Pageable pageable) {

        LocalDate hoje = LocalDate.now();

        LocalDate inicio = dataInicial != null
                ? dataInicial
                : hoje.withDayOfMonth(1);

        LocalDate fim = dataFinal != null
                ? dataFinal
                : hoje;

        Page<MovimentacaoResponse> movimentacoes =
                movimentacaoService.listar(
                        empresaId,
                        inicio,
                        fim,
                        tipo,
                        categoriaId,
                        pageable
                );

        return ResponseEntity.ok(movimentacoes);
    }

    @GetMapping("/{movimentacaoId}")
    public ResponseEntity<MovimentacaoResponse> buscarPorId(
            @PathVariable Long empresaId,
            @PathVariable Long movimentacaoId) {

        MovimentacaoResponse movimentacao =
                movimentacaoService.buscarPorId(
                        empresaId,
                        movimentacaoId
                );

        return ResponseEntity.ok(movimentacao);
    }

    @PutMapping("/{movimentacaoId}")
    public ResponseEntity<MovimentacaoResponse> atualizar(
            @PathVariable Long empresaId,
            @PathVariable Long movimentacaoId,
            @Valid @RequestBody
            AtualizarMovimentacaoRequest request) {

        MovimentacaoResponse movimentacao =
                movimentacaoService.atualizar(
                        empresaId,
                        movimentacaoId,
                        request
                );

        return ResponseEntity.ok(movimentacao);
    }

    @DeleteMapping("/{movimentacaoId}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long empresaId,
            @PathVariable Long movimentacaoId) {

        movimentacaoService.excluir(
                empresaId,
                movimentacaoId
        );

        return ResponseEntity.noContent().build();
    }
}
