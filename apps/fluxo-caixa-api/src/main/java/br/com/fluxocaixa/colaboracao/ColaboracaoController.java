package br.com.fluxocaixa.colaboracao;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/colaboracao/empresas/{empresaId}")
public class ColaboracaoController {

    private final ColaboracaoService colaboracaoService;

    public ColaboracaoController(
            ColaboracaoService colaboracaoService) {

        this.colaboracaoService = colaboracaoService;
    }

    @GetMapping("/produtor/dashboard")
    public ProdutorDashboardResponse dashboardProdutor(
            @PathVariable Long empresaId) {

        return colaboracaoService.dashboardProdutor(empresaId);
    }

    @GetMapping("/propriedades")
    public List<PropriedadeRuralResponse> listarPropriedades(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarPropriedades(empresaId);
    }

    @PostMapping("/propriedades")
    public PropriedadeRuralResponse criarPropriedade(
            @PathVariable Long empresaId,
            @RequestBody CriarPropriedadeRequest request) {

        return colaboracaoService.criarPropriedade(
                empresaId,
                request
        );
    }

    @GetMapping("/atividades")
    public List<AtividadeRuralResponse> listarAtividades(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarAtividades(empresaId);
    }

    @PostMapping("/atividades")
    public AtividadeRuralResponse criarAtividade(
            @PathVariable Long empresaId,
            @RequestBody CriarAtividadeRequest request) {

        return colaboracaoService.criarAtividade(
                empresaId,
                request
        );
    }

    @GetMapping("/documentos")
    public List<DocumentoAgroResponse> listarDocumentos(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarDocumentos(empresaId);
    }

    @PostMapping(
            value = "/documentos",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public DocumentoAgroResponse enviarDocumento(
            @PathVariable Long empresaId,
            @RequestParam(required = false) Long movimentacaoId,
            @RequestParam(required = false) TipoDocumentoAgro tipo,
            @RequestParam(required = false) String observacao,
            @RequestPart("arquivo") MultipartFile arquivo) {

        return colaboracaoService.enviarDocumento(
                empresaId,
                movimentacaoId,
                tipo,
                observacao,
                arquivo
        );
    }

    @GetMapping("/documentos/{documentoId}/download")
    public ResponseEntity<byte[]> baixarDocumento(
            @PathVariable Long empresaId,
            @PathVariable Long documentoId) {

        DocumentoAgro documento =
                colaboracaoService.obterDocumento(
                        empresaId,
                        documentoId
                );

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        documento.getTipoConteudo()
                ))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(documento.getNomeArquivo())
                                .build()
                                .toString()
                )
                .body(documento.getConteudo());
    }

    @GetMapping("/pendencias")
    public List<PendenciaAgroResponse> listarPendencias(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarPendencias(empresaId);
    }

    @PostMapping("/pendencias")
    public PendenciaAgroResponse criarPendencia(
            @PathVariable Long empresaId,
            @RequestBody CriarPendenciaRequest request) {

        return colaboracaoService.criarPendencia(
                empresaId,
                request
        );
    }

    @GetMapping("/pendencias/{pendenciaId}/mensagens")
    public List<PendenciaMensagemResponse> listarMensagens(
            @PathVariable Long empresaId,
            @PathVariable Long pendenciaId) {

        return colaboracaoService.listarMensagens(
                empresaId,
                pendenciaId
        );
    }

    @PostMapping("/pendencias/{pendenciaId}/mensagens")
    public PendenciaMensagemResponse comentarPendencia(
            @PathVariable Long empresaId,
            @PathVariable Long pendenciaId,
            @RequestBody CriarMensagemPendenciaRequest request) {

        return colaboracaoService.comentarPendencia(
                empresaId,
                pendenciaId,
                request
        );
    }

    @PostMapping("/pendencias/{pendenciaId}/resolver")
    public PendenciaAgroResponse resolverPendencia(
            @PathVariable Long empresaId,
            @PathVariable Long pendenciaId) {

        return colaboracaoService.resolverPendencia(
                empresaId,
                pendenciaId
        );
    }

    @PostMapping("/classificacao/sugerir")
    public ClassificacaoSugestaoResponse sugerirClassificacao(
            @PathVariable Long empresaId,
            @RequestBody SugerirClassificacaoRequest request) {

        return colaboracaoService.sugerirClassificacao(
                empresaId,
                request
        );
    }

    @GetMapping("/rateios")
    public List<RateioResponse> listarRateios(
            @PathVariable Long empresaId) {

        return colaboracaoService.listarRateios(empresaId);
    }

    @PostMapping("/rateios")
    public RateioResponse criarRateio(
            @PathVariable Long empresaId,
            @RequestBody CriarRateioRequest request) {

        return colaboracaoService.criarRateio(
                empresaId,
                request
        );
    }

    @GetMapping("/visao-tributaria")
    public VisaoTributariaResponse visaoTributaria(
            @PathVariable Long empresaId,
            @RequestParam(defaultValue = "0")
            int ano,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        LocalDate inicio = dataInicial;
        LocalDate fim = dataFinal;

        if (inicio == null && fim == null && ano > 0) {
            inicio = LocalDate.of(ano, 1, 1);
            fim = LocalDate.of(ano, 12, 31);
        }

        return colaboracaoService.visaoTributaria(
                empresaId,
                inicio,
                fim
        );
    }

    @GetMapping("/exportacoes/movimentacoes.csv")
    public ResponseEntity<byte[]> exportarMovimentacoes(
            @PathVariable Long empresaId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        byte[] csv = colaboracaoService
                .exportarMovimentacoesCsv(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        return ResponseEntity.ok()
                .contentType(
                        new MediaType(
                                "text",
                                "csv"
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=movimentacoes-agro.csv"
                )
                .body(csv);
    }
}
