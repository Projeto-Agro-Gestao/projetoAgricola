package br.com.fluxocaixa.fornecedor;

import jakarta.validation.Valid;
import br.com.fluxocaixa.produto.CategoriaProdutoResponse;
import br.com.fluxocaixa.produto.CriarCategoriaProdutoRequest;
import br.com.fluxocaixa.produto.CriarProdutoRequest;
import br.com.fluxocaixa.produto.ProdutoResponse;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/fornecedores")
public class FornecedorController {

    private final FornecedorService fornecedorService;
    private final FornecedorRelatorioService fornecedorRelatorioService;

    public FornecedorController(
            FornecedorService fornecedorService,
            FornecedorRelatorioService fornecedorRelatorioService) {

        this.fornecedorService = fornecedorService;
        this.fornecedorRelatorioService =
                fornecedorRelatorioService;
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

    @PostMapping("/categorias-produto")
    public ResponseEntity<CategoriaProdutoResponse>
    criarCategoriaProduto(
            @PathVariable Long empresaId,
            @Valid @RequestBody
            CriarCategoriaProdutoRequest request) {

        return ResponseEntity.ok(
                fornecedorService.criarCategoriaProduto(
                        empresaId,
                        request
                )
        );
    }

    @GetMapping("/categorias-produto")
    public ResponseEntity<List<CategoriaProdutoResponse>>
    listarCategoriasProduto(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                fornecedorService.listarCategoriasProduto(
                        empresaId
                )
        );
    }

    @PostMapping("/produtos")
    public ResponseEntity<ProdutoResponse> criarProduto(
            @PathVariable Long empresaId,
            @Valid @RequestBody
            CriarProdutoRequest request) {

        return ResponseEntity.ok(
                fornecedorService.criarProduto(
                        empresaId,
                        request
                )
        );
    }

    @GetMapping("/produtos")
    public ResponseEntity<List<ProdutoResponse>> listarProdutos(
            @PathVariable Long empresaId,
            @RequestParam(required = false)
            Long categoriaProdutoId) {

        return ResponseEntity.ok(
                fornecedorService.listarProdutos(
                        empresaId,
                        categoriaProdutoId
                )
        );
    }

    @PostMapping("/cotacoes")
    public ResponseEntity<CotacaoFornecedorResponse> criarCotacao(
            @PathVariable Long empresaId,
            @Valid @RequestBody
            CriarCotacaoFornecedorRequest request) {

        return ResponseEntity.ok(
                fornecedorService.criarCotacao(
                        empresaId,
                        request
                )
        );
    }

    @GetMapping("/cotacoes")
    public ResponseEntity<List<CotacaoFornecedorResponse>>
    listarCotacoes(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                fornecedorService.listarCotacoes(
                        empresaId
                )
        );
    }

    @GetMapping("/comparativo-cotacoes")
    public ResponseEntity<List<ComparativoCotacaoFornecedorResponse>>
    compararCotacoes(
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                fornecedorService.compararCotacoes(
                        empresaId
                )
        );
    }

    @PatchMapping("/cotacoes/{cotacaoId}/enviar-financeiro")
    public ResponseEntity<CotacaoFornecedorResponse>
    enviarCotacaoAoFinanceiro(
            @PathVariable Long empresaId,
            @PathVariable Long cotacaoId,
            @Valid @RequestBody
            EnviarCotacaoAoFinanceiroRequest request) {

        return ResponseEntity.ok(
                fornecedorService.enviarCotacaoAoFinanceiro(
                        empresaId,
                        cotacaoId,
                        request
                )
        );
    }

    @PatchMapping("/cotacoes/{cotacaoId}/enviar-contas")
    public ResponseEntity<CotacaoFornecedorResponse>
    enviarCotacaoAsContas(
            @PathVariable Long empresaId,
            @PathVariable Long cotacaoId,
            @Valid @RequestBody
            EnviarCotacaoAsContasRequest request) {

        return ResponseEntity.ok(
                fornecedorService.enviarCotacaoAsContas(
                        empresaId,
                        cotacaoId,
                        request
                )
        );
    }

    @GetMapping("/relatorio-excel")
    public ResponseEntity<byte[]> gerarRelatorioExcel(
            @PathVariable Long empresaId) {

        return criarDownload(
                fornecedorRelatorioService.gerarExcel(
                        empresaId
                ),
                "comparativo-fornecedores-empresa-"
                        + empresaId
                        + ".xlsx",
                MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
        );
    }

    @GetMapping("/relatorio-pdf")
    public ResponseEntity<byte[]> gerarRelatorioPdf(
            @PathVariable Long empresaId) {

        return criarDownload(
                fornecedorRelatorioService.gerarPdf(
                        empresaId
                ),
                "comparativo-fornecedores-empresa-"
                        + empresaId
                        + ".pdf",
                MediaType.APPLICATION_PDF
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

    private ResponseEntity<byte[]> criarDownload(
            byte[] arquivo,
            String nomeArquivo,
            MediaType mediaType) {

        ContentDisposition contentDisposition =
                ContentDisposition
                        .attachment()
                        .filename(
                                nomeArquivo,
                                StandardCharsets.UTF_8
                        )
                        .build();

        return ResponseEntity
                .ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        contentDisposition.toString()
                )
                .contentLength(arquivo.length)
                .body(arquivo);
    }
}
