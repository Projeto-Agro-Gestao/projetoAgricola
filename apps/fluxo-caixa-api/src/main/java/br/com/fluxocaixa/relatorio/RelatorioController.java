package br.com.fluxocaixa.relatorio;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/relatorios")
public class RelatorioController {

    private static final MediaType MEDIA_TYPE_EXCEL =
            MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

    private static final MediaType MEDIA_TYPE_PDF =
            MediaType.APPLICATION_PDF;

    private static final DateTimeFormatter FORMATADOR_NOME_ARQUIVO =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final RelatorioExcelService relatorioExcelService;
    private final RelatorioPdfService relatorioPdfService;

    public RelatorioController(
            RelatorioExcelService relatorioExcelService,
            RelatorioPdfService relatorioPdfService) {

        this.relatorioExcelService =
                relatorioExcelService;

        this.relatorioPdfService =
                relatorioPdfService;
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> gerarExcel(
            @PathVariable Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        PeriodoRelatorio periodo =
                resolverPeriodo(
                        dataInicial,
                        dataFinal
                );

        byte[] arquivo =
                relatorioExcelService.gerar(
                        empresaId,
                        periodo.inicio(),
                        periodo.fim()
                );

        String nomeArquivo =
                criarNomeArquivo(
                        "relatorio-financeiro",
                        empresaId,
                        periodo,
                        ".xlsx"
                );

        return criarRespostaDownload(
                arquivo,
                nomeArquivo,
                MEDIA_TYPE_EXCEL
        );
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> gerarPdf(
            @PathVariable Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        PeriodoRelatorio periodo =
                resolverPeriodo(
                        dataInicial,
                        dataFinal
                );

        byte[] arquivo =
                relatorioPdfService.gerar(
                        empresaId,
                        periodo.inicio(),
                        periodo.fim()
                );

        String nomeArquivo =
                criarNomeArquivo(
                        "relatorio-gerencial",
                        empresaId,
                        periodo,
                        ".pdf"
                );

        return criarRespostaDownload(
                arquivo,
                nomeArquivo,
                MEDIA_TYPE_PDF
        );
    }

    private PeriodoRelatorio resolverPeriodo(
            LocalDate dataInicial,
            LocalDate dataFinal) {

        LocalDate hoje =
                LocalDate.now();

        LocalDate inicio =
                dataInicial != null
                        ? dataInicial
                        : hoje.withDayOfMonth(1);

        LocalDate fim =
                dataFinal != null
                        ? dataFinal
                        : hoje;

        return new PeriodoRelatorio(
                inicio,
                fim
        );
    }

    private String criarNomeArquivo(
            String prefixo,
            Long empresaId,
            PeriodoRelatorio periodo,
            String extensao) {

        return prefixo
                + "-empresa-"
                + empresaId
                + "-"
                + periodo.inicio()
                .format(
                        FORMATADOR_NOME_ARQUIVO
                )
                + "-a-"
                + periodo.fim()
                .format(
                        FORMATADOR_NOME_ARQUIVO
                )
                + extensao;
    }

    private ResponseEntity<byte[]>
    criarRespostaDownload(
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
                .contentLength(
                        arquivo.length
                )
                .body(arquivo);
    }

    private record PeriodoRelatorio(
            LocalDate inicio,
            LocalDate fim
    ) {
    }
}