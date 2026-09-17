package br.com.fluxocaixa.fornecedor;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FornecedorRelatorioService {

    private static final DateTimeFormatter FORMATADOR_DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final CotacaoFornecedorRepository cotacaoRepository;

    public FornecedorRelatorioService(
            CotacaoFornecedorRepository cotacaoRepository) {

        this.cotacaoRepository = cotacaoRepository;
    }

    @Transactional(readOnly = true)
    public byte[] gerarExcel(Long empresaId) {
        List<CotacaoFornecedor> cotacoes =
                buscarCotacoes(empresaId);

        try (
                Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream saida =
                        new ByteArrayOutputStream()
        ) {
            CellStyle cabecalho = criarCabecalho(workbook);
            CellStyle texto = workbook.createCellStyle();
            texto.setWrapText(true);
            CellStyle moeda = workbook.createCellStyle();
            moeda.setDataFormat(
                    workbook
                            .createDataFormat()
                            .getFormat(
                                    "R$ #,##0.00;[Red]-R$ #,##0.00"
                            )
            );

            Sheet planilha =
                    workbook.createSheet(
                            "Comparativo fornecedores"
                    );

            criarLinhaCabecalho(
                    planilha,
                    cabecalho,
                    "Data",
                    "Categoria",
                    "Produto",
                    "Fornecedor",
                    "Status",
                    "Quantidade",
                    "Unidade",
                    "Peso total kg",
                    "Valor total",
                    "Valor liquido",
                    "Valor por kg",
                    "Valor por unidade",
                    "Valor por lote",
                    "Melhor compra"
            );

            Map<Long, BigDecimal> melhores =
                    melhoresPorProduto(cotacoes);

            int linhaAtual = 1;

            for (CotacaoFornecedor cotacao : cotacoes) {
                Row linha = planilha.createRow(linhaAtual++);
                criarTexto(linha, 0, cotacao.getDataCotacao().format(FORMATADOR_DATA), texto);
                criarTexto(linha, 1, cotacao.getProduto().getCategoria().getNome(), texto);
                criarTexto(linha, 2, cotacao.getProduto().getNome(), texto);
                criarTexto(linha, 3, cotacao.getFornecedor().getNome(), texto);
                criarTexto(linha, 4, cotacao.getStatus().name(), texto);
                criarNumero(linha, 5, cotacao.getQuantidade(), texto);
                criarTexto(linha, 6, cotacao.getUnidadeMedida(), texto);
                criarNumero(linha, 7, cotacao.getPesoTotalKg(), texto);
                criarMoeda(linha, 8, cotacao.getValorTotal(), moeda);
                criarMoeda(linha, 9, cotacao.getValorLiquido(), moeda);
                criarMoeda(linha, 10, cotacao.getValorPorKg(), moeda);
                criarMoeda(linha, 11, cotacao.getValorPorUnidade(), moeda);
                criarMoeda(linha, 12, cotacao.getValorPorLote(), moeda);
                criarTexto(
                        linha,
                        13,
                        eMelhor(cotacao, melhores) ? "SIM" : "NAO",
                        texto
                );
            }

            for (int coluna = 0; coluna < 14; coluna++) {
                planilha.autoSizeColumn(coluna);
            }

            workbook.write(saida);
            return saida.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Nao foi possivel gerar o relatorio Excel de fornecedores",
                    exception
            );
        }
    }

    @Transactional(readOnly = true)
    public byte[] gerarPdf(Long empresaId) {
        List<CotacaoFornecedor> cotacoes =
                buscarCotacoes(empresaId);

        ByteArrayOutputStream saida =
                new ByteArrayOutputStream();
        Document documento =
                new Document(PageSize.A4.rotate(), 30, 30, 30, 30);

        PdfWriter.getInstance(documento, saida);
        documento.open();

        Paragraph titulo =
                new Paragraph(
                        "RELATORIO COMPARATIVO DE FORNECEDORES",
                        FontFactory.getFont(
                                FontFactory.HELVETICA_BOLD,
                                15,
                                new Color(31, 78, 45)
                        )
                );
        titulo.setAlignment(Element.ALIGN_CENTER);
        titulo.setSpacingAfter(10);
        documento.add(titulo);

        documento.add(
                new Paragraph(
                        "Este relatorio compara somente produto igual com produto igual. "
                                + "Semente de trigo e comparada com semente de trigo; "
                                + "semente de soja e comparada com semente de soja. "
                                + "Quando ha peso em kg, o sistema usa o valor liquido dividido pelo peso total. "
                                + "Quando nao ha peso, usa o valor por unidade ou por lote.",
                        FontFactory.getFont(
                                FontFactory.HELVETICA,
                                9,
                                Color.DARK_GRAY
                        )
                )
        );

        PdfPTable tabela =
                new PdfPTable(
                        new float[]{
                                1.1f, 1.5f, 2f, 2f,
                                1.1f, 1.1f, 1.2f, 1.2f,
                                1.2f, 1.2f, 1.1f
                        }
                );
        tabela.setWidthPercentage(100);
        tabela.setSpacingBefore(12);

        adicionarCabecalho(
                tabela,
                "Data",
                "Categoria",
                "Produto",
                "Fornecedor",
                "Qtd.",
                "Unid.",
                "Kg total",
                "Total",
                "R$/kg",
                "R$/unid.",
                "Melhor"
        );

        Map<Long, BigDecimal> melhores =
                melhoresPorProduto(cotacoes);

        cotacoes.forEach(
                cotacao -> {
                    adicionarCelula(tabela, cotacao.getDataCotacao().format(FORMATADOR_DATA));
                    adicionarCelula(tabela, cotacao.getProduto().getCategoria().getNome());
                    adicionarCelula(tabela, cotacao.getProduto().getNome());
                    adicionarCelula(tabela, cotacao.getFornecedor().getNome());
                    adicionarCelula(tabela, numero(cotacao.getQuantidade()));
                    adicionarCelula(tabela, cotacao.getUnidadeMedida());
                    adicionarCelula(tabela, numero(cotacao.getPesoTotalKg()));
                    adicionarCelula(tabela, moeda(cotacao.getValorLiquido()));
                    adicionarCelula(tabela, moeda(cotacao.getValorPorKg()));
                    adicionarCelula(tabela, moeda(cotacao.getValorPorUnidade()));
                    adicionarCelula(
                            tabela,
                            eMelhor(cotacao, melhores) ? "SIM" : "-"
                    );
                }
        );

        documento.add(tabela);
        documento.close();

        return saida.toByteArray();
    }

    private List<CotacaoFornecedor> buscarCotacoes(Long empresaId) {
        return cotacaoRepository
                .findAllByEmpresa_IdOrderByDataCotacaoDescIdDesc(
                        empresaId
                )
                .stream()
                .sorted(
                        Comparator
                                .comparing(
                                        (CotacaoFornecedor cotacao) ->
                                                cotacao.getProduto().getNome(),
                                        String.CASE_INSENSITIVE_ORDER
                                )
                                .thenComparing(
                                        CotacaoFornecedor::getValorPorKg,
                                        Comparator.nullsLast(
                                                Comparator.naturalOrder()
                                        )
                                )
                )
                .toList();
    }

    private Map<Long, BigDecimal> melhoresPorProduto(
            List<CotacaoFornecedor> cotacoes) {

        return cotacoes
                .stream()
                .filter(
                        cotacao -> valorComparavel(cotacao) != null
                )
                .collect(
                        Collectors.toMap(
                                cotacao -> cotacao.getProduto().getId(),
                                this::valorComparavel,
                                (atual, novo) ->
                                        novo.compareTo(atual) < 0
                                                ? novo
                                                : atual
                        )
                );
    }

    private boolean eMelhor(
            CotacaoFornecedor cotacao,
            Map<Long, BigDecimal> melhores) {

        BigDecimal valor = valorComparavel(cotacao);
        BigDecimal melhor =
                melhores.get(cotacao.getProduto().getId());

        return valor != null
                && melhor != null
                && valor.compareTo(melhor) == 0;
    }

    private BigDecimal valorComparavel(
            CotacaoFornecedor cotacao) {

        if (cotacao.getValorPorKg() != null) {
            return cotacao.getValorPorKg();
        }

        if (cotacao.getValorPorUnidade() != null) {
            return cotacao.getValorPorUnidade();
        }

        return cotacao.getValorPorLote();
    }

    private CellStyle criarCabecalho(Workbook workbook) {
        Font fonte = workbook.createFont();
        fonte.setBold(true);
        fonte.setColor(IndexedColors.WHITE.getIndex());

        CellStyle estilo = workbook.createCellStyle();
        estilo.setFont(fonte);
        estilo.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
        estilo.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return estilo;
    }

    private void criarLinhaCabecalho(
            Sheet planilha,
            CellStyle estilo,
            String... titulos) {

        Row linha = planilha.createRow(0);

        for (int indice = 0; indice < titulos.length; indice++) {
            Cell celula = linha.createCell(indice);
            celula.setCellValue(titulos[indice]);
            celula.setCellStyle(estilo);
        }
    }

    private void criarTexto(
            Row linha,
            int coluna,
            String valor,
            CellStyle estilo) {

        Cell celula = linha.createCell(coluna);
        celula.setCellValue(valor == null ? "-" : valor);
        celula.setCellStyle(estilo);
    }

    private void criarNumero(
            Row linha,
            int coluna,
            BigDecimal valor,
            CellStyle estilo) {

        Cell celula = linha.createCell(coluna);
        celula.setCellValue(
                valor == null
                        ? 0
                        : valor.doubleValue()
        );
        celula.setCellStyle(estilo);
    }

    private void criarMoeda(
            Row linha,
            int coluna,
            BigDecimal valor,
            CellStyle estilo) {

        criarNumero(linha, coluna, valor, estilo);
    }

    private void adicionarCabecalho(
            PdfPTable tabela,
            String... titulos) {

        for (String titulo : titulos) {
            PdfPCell celula =
                    new PdfPCell(
                            new Phrase(
                                    titulo,
                                    FontFactory.getFont(
                                            FontFactory.HELVETICA_BOLD,
                                            8,
                                            Color.WHITE
                                    )
                            )
                    );
            celula.setBackgroundColor(new Color(31, 78, 45));
            celula.setPadding(5);
            tabela.addCell(celula);
        }
    }

    private void adicionarCelula(
            PdfPTable tabela,
            String texto) {

        PdfPCell celula =
                new PdfPCell(
                        new Phrase(
                                texto == null ? "-" : texto,
                                FontFactory.getFont(
                                        FontFactory.HELVETICA,
                                        8
                                )
                        )
                );
        celula.setPadding(5);
        tabela.addCell(celula);
    }

    private String moeda(BigDecimal valor) {
        if (valor == null) {
            return "-";
        }

        return "R$ "
                + valor.setScale(
                        2,
                        RoundingMode.HALF_UP
                ).toPlainString()
                .replace(".", ",");
    }

    private String numero(BigDecimal valor) {
        if (valor == null) {
            return "-";
        }

        return valor.stripTrailingZeros()
                .toPlainString()
                .replace(".", ",");
    }
}
