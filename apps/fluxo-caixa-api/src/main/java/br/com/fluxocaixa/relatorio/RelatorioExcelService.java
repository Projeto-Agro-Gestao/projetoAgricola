package br.com.fluxocaixa.relatorio;

import br.com.fluxocaixa.contafinanceira.ContaFinanceiraResponse;
import br.com.fluxocaixa.contafinanceira.ProjecaoDiariaContaResponse;
import br.com.fluxocaixa.dashboard.PontoFluxoCaixaResponse;
import br.com.fluxocaixa.movimentacao.MovimentacaoResponse;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RelatorioExcelService {

    private static final DateTimeFormatter
            FORMATADOR_DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RelatorioGerencialService
            relatorioGerencialService;

    public RelatorioExcelService(
            RelatorioGerencialService
                    relatorioGerencialService) {

        this.relatorioGerencialService =
                relatorioGerencialService;
    }

    public byte[] gerar(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        DadosRelatorioGerencial dados =
                relatorioGerencialService.gerarDados(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        try (
                Workbook workbook =
                        new XSSFWorkbook();

                ByteArrayOutputStream saida =
                        new ByteArrayOutputStream()
        ) {

            EstilosExcel estilos =
                    criarEstilos(workbook);

            criarResumoExecutivo(
                    workbook,
                    dados,
                    estilos
            );

            criarFluxoCaixa(
                    workbook,
                    dados,
                    estilos
            );

            criarMovimentacoes(
                    workbook,
                    dados,
                    estilos
            );

            criarContas(
                    workbook,
                    "Contas a Receber",
                    dados.contasAReceber(),
                    estilos
            );

            criarContas(
                    workbook,
                    "Contas a Pagar",
                    dados.contasAPagar(),
                    estilos
            );

            criarAnaliseCategorias(
                    workbook,
                    dados,
                    estilos
            );

            criarProjecaoFinanceira(
                    workbook,
                    dados,
                    estilos
            );

            workbook.write(saida);

            return saida.toByteArray();

        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Não foi possível gerar o relatório Excel",
                    exception
            );
        }
    }

    private void criarResumoExecutivo(
            Workbook workbook,
            DadosRelatorioGerencial dados,
            EstilosExcel estilos) {

        Sheet planilha =
                workbook.createSheet(
                        "Resumo Executivo"
                );

        int linhaAtual = 0;

        Row titulo =
                planilha.createRow(linhaAtual++);

        Cell celulaTitulo =
                titulo.createCell(0);

        celulaTitulo.setCellValue(
                "RELATÓRIO FINANCEIRO GERENCIAL"
        );

        celulaTitulo.setCellStyle(
                estilos.titulo()
        );

        linhaAtual++;

        linhaAtual = adicionarInformacao(
                planilha,
                linhaAtual,
                "Empresa",
                dados.empresa().nome(),
                estilos
        );

        linhaAtual = adicionarInformacao(
                planilha,
                linhaAtual,
                "Documento",
                textoOuTraco(
                        dados.empresa().documento()
                ),
                estilos
        );

        linhaAtual = adicionarInformacao(
                planilha,
                linhaAtual,
                "Período",
                formatarData(dados.dataInicial())
                        + " a "
                        + formatarData(
                        dados.dataFinal()
                ),
                estilos
        );

        linhaAtual += 2;

        linhaAtual = adicionarSecao(
                planilha,
                linhaAtual,
                "REALIZADO",
                estilos
        );

        linhaAtual = adicionarValorMonetario(
                planilha,
                linhaAtual,
                "Receitas realizadas",
                dados.resumoRealizado()
                        .totalEntrou(),
                estilos
        );

        linhaAtual = adicionarValorMonetario(
                planilha,
                linhaAtual,
                "Despesas realizadas",
                dados.resumoRealizado()
                        .totalSaiu(),
                estilos
        );

        linhaAtual = adicionarValorMonetario(
                planilha,
                linhaAtual,
                "Resultado realizado",
                dados.resumoRealizado()
                        .quantoSobrou(),
                estilos
        );

        linhaAtual = adicionarPercentual(
                planilha,
                linhaAtual,
                "Margem de lucro",
                dados.resumoRealizado()
                        .margemLucro(),
                estilos
        );

        linhaAtual = adicionarPercentual(
                planilha,
                linhaAtual,
                "Ganho sobre custo",
                dados.resumoRealizado()
                        .ganhoSobreCusto(),
                estilos
        );

        linhaAtual += 2;

        linhaAtual = adicionarSecao(
                planilha,
                linhaAtual,
                "COMPROMISSOS DO PERÍODO",
                estilos
        );

        linhaAtual = adicionarValorMonetario(
                planilha,
                linhaAtual,
                "Total a receber",
                dados.resumoContas()
                        .totalAReceber(),
                estilos
        );

        linhaAtual = adicionarValorMonetario(
                planilha,
                linhaAtual,
                "Total a pagar",
                dados.resumoContas()
                        .totalAPagar(),
                estilos
        );

        linhaAtual = adicionarValorMonetario(
                planilha,
                linhaAtual,
                "Diferença prevista",
                dados.resumoContas()
                        .diferencaPrevista(),
                estilos
        );

        linhaAtual = adicionarNumero(
                planilha,
                linhaAtual,
                "Contas a receber",
                dados.resumoContas()
                        .quantidadeContasAReceber(),
                estilos
        );

        linhaAtual = adicionarNumero(
                planilha,
                linhaAtual,
                "Contas a pagar",
                dados.resumoContas()
                        .quantidadeContasAPagar(),
                estilos
        );

        linhaAtual = adicionarNumero(
                planilha,
                linhaAtual,
                "Contas vencidas",
                dados.resumoContas()
                        .quantidadeVencidas(),
                estilos
        );

        linhaAtual = adicionarNumero(
                planilha,
                linhaAtual,
                "Lembretes ativos",
                dados.resumoContas()
                        .quantidadeLembretes(),
                estilos
        );

        linhaAtual++;

        adicionarInformacao(
                planilha,
                linhaAtual,
                "Situação da previsão",
                dados.resumoContas()
                        .previsaoPositiva()
                        ? "POSITIVA"
                        : "NEGATIVA",
                estilos
        );

        planilha.setColumnWidth(0, 34 * 256);
        planilha.setColumnWidth(1, 28 * 256);

        planilha.createFreezePane(0, 1);
    }

    private void criarFluxoCaixa(
            Workbook workbook,
            DadosRelatorioGerencial dados,
            EstilosExcel estilos) {

        Sheet planilha =
                workbook.createSheet(
                        "Fluxo de Caixa"
                );

        criarCabecalho(
                planilha,
                estilos,
                "Data",
                "Receitas",
                "Despesas",
                "Saldo do dia"
        );

        int linhaAtual = 1;

        for (
                PontoFluxoCaixaResponse ponto
                : dados.fluxoCaixa()
        ) {

            Row linha =
                    planilha.createRow(
                            linhaAtual++
                    );

            criarCelulaTexto(
                    linha,
                    0,
                    formatarData(
                            ponto.data()
                    ),
                    estilos.texto()
            );

            criarCelulaMonetaria(
                    linha,
                    1,
                    ponto.totalReceitas(),
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    2,
                    ponto.totalDespesas(),
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    3,
                    ponto.saldoDoDia(),
                    estilos.moeda()
            );
        }

        configurarTabela(
                planilha,
                4,
                linhaAtual
        );
    }

    private void criarMovimentacoes(
            Workbook workbook,
            DadosRelatorioGerencial dados,
            EstilosExcel estilos) {

        Sheet planilha =
                workbook.createSheet(
                        "Movimentações"
                );

        criarCabecalho(
                planilha,
                estilos,
                "Data",
                "Tipo",
                "Categoria",
                "Descrição",
                "Valor",
                "Observação",
                "Criado em"
        );

        int linhaAtual = 1;

        for (
                MovimentacaoResponse movimentacao
                : dados.movimentacoes()
        ) {

            Row linha =
                    planilha.createRow(
                            linhaAtual++
                    );

            criarCelulaTexto(
                    linha,
                    0,
                    formatarData(
                            movimentacao
                                    .dataMovimentacao()
                    ),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    1,
                    movimentacao.explicacao(),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    2,
                    movimentacao.categoriaNome(),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    3,
                    movimentacao.descricao(),
                    estilos.texto()
            );

            criarCelulaMonetaria(
                    linha,
                    4,
                    movimentacao.valor(),
                    estilos.moeda()
            );

            criarCelulaTexto(
                    linha,
                    5,
                    textoOuTraco(
                            movimentacao.observacao()
                    ),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    6,
                    movimentacao.criadoEm()
                            == null
                            ? "-"
                            : movimentacao
                            .criadoEm()
                            .format(
                                    DateTimeFormatter
                                            .ofPattern(
                                                    "dd/MM/yyyy HH:mm"
                                            )
                            ),
                    estilos.texto()
            );
        }

        configurarTabela(
                planilha,
                7,
                linhaAtual
        );
    }

    private void criarContas(
            Workbook workbook,
            String nomePlanilha,
            List<ContaFinanceiraResponse> contas,
            EstilosExcel estilos) {

        Sheet planilha =
                workbook.createSheet(
                        nomePlanilha
                );

        criarCabecalho(
                planilha,
                estilos,
                "Vencimento",
                "Favorecido",
                "Descrição",
                "Categoria",
                "Documento",
                "Valor total",
                "Liquidado",
                "Pendente",
                "Situação",
                "Dias p/ vencimento",
                "Vencida",
                "Observação"
        );

        int linhaAtual = 1;

        for (
                ContaFinanceiraResponse conta
                : contas
        ) {

            Row linha =
                    planilha.createRow(
                            linhaAtual++
                    );

            criarCelulaTexto(
                    linha,
                    0,
                    formatarData(
                            conta.dataVencimento()
                    ),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    1,
                    textoOuTraco(
                            conta.favorecido()
                    ),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    2,
                    conta.descricao(),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    3,
                    conta.categoriaNome(),
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    4,
                    textoOuTraco(
                            conta.numeroDocumento()
                    ),
                    estilos.texto()
            );

            criarCelulaMonetaria(
                    linha,
                    5,
                    conta.valorTotal(),
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    6,
                    conta.valorLiquidado(),
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    7,
                    conta.valorPendente(),
                    estilos.moeda()
            );

            criarCelulaTexto(
                    linha,
                    8,
                    conta.situacaoDescricao(),
                    estilos.texto()
            );

            criarCelulaNumero(
                    linha,
                    9,
                    conta.diasParaVencimento(),
                    estilos.numero()
            );

            criarCelulaTexto(
                    linha,
                    10,
                    conta.vencida()
                            ? "SIM"
                            : "NÃO",
                    estilos.texto()
            );

            criarCelulaTexto(
                    linha,
                    11,
                    textoOuTraco(
                            conta.observacao()
                    ),
                    estilos.texto()
            );
        }

        configurarTabela(
                planilha,
                12,
                linhaAtual
        );
    }

    private void criarAnaliseCategorias(
            Workbook workbook,
            DadosRelatorioGerencial dados,
            EstilosExcel estilos) {

        Sheet planilha =
                workbook.createSheet(
                        "Análise por Categoria"
                );

        criarCabecalho(
                planilha,
                estilos,
                "Categoria",
                "Receitas",
                "Despesas",
                "Resultado"
        );

        Map<String, BigDecimal> receitas =
                new LinkedHashMap<>();

        Map<String, BigDecimal> despesas =
                new LinkedHashMap<>();

        for (
                MovimentacaoResponse movimentacao
                : dados.movimentacoes()
        ) {

            String categoria =
                    movimentacao.categoriaNome();

            if (
                    movimentacao.tipo()
                            == TipoMovimentacao.RECEITA
            ) {
                receitas.merge(
                        categoria,
                        movimentacao.valor(),
                        BigDecimal::add
                );
            } else {
                despesas.merge(
                        categoria,
                        movimentacao.valor(),
                        BigDecimal::add
                );
            }
        }

        Map<String, Boolean> categorias =
                new LinkedHashMap<>();

        receitas.keySet().forEach(
                categoria ->
                        categorias.put(
                                categoria,
                                true
                        )
        );

        despesas.keySet().forEach(
                categoria ->
                        categorias.put(
                                categoria,
                                true
                        )
        );

        int linhaAtual = 1;

        for (
                String categoria
                : categorias.keySet()
        ) {

            BigDecimal totalReceitas =
                    receitas.getOrDefault(
                            categoria,
                            BigDecimal.ZERO
                    );

            BigDecimal totalDespesas =
                    despesas.getOrDefault(
                            categoria,
                            BigDecimal.ZERO
                    );

            Row linha =
                    planilha.createRow(
                            linhaAtual++
                    );

            criarCelulaTexto(
                    linha,
                    0,
                    categoria,
                    estilos.texto()
            );

            criarCelulaMonetaria(
                    linha,
                    1,
                    totalReceitas,
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    2,
                    totalDespesas,
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    3,
                    totalReceitas.subtract(
                            totalDespesas
                    ),
                    estilos.moeda()
            );
        }

        configurarTabela(
                planilha,
                4,
                linhaAtual
        );
    }

    private void criarProjecaoFinanceira(
            Workbook workbook,
            DadosRelatorioGerencial dados,
            EstilosExcel estilos) {

        Sheet planilha =
                workbook.createSheet(
                        "Projeção Financeira"
                );

        criarCabecalho(
                planilha,
                estilos,
                "Data",
                "A receber",
                "A pagar",
                "Diferença prevista"
        );

        int linhaAtual = 1;

        for (
                ProjecaoDiariaContaResponse ponto
                : dados.projecaoFinanceira()
        ) {

            Row linha =
                    planilha.createRow(
                            linhaAtual++
                    );

            criarCelulaTexto(
                    linha,
                    0,
                    formatarData(
                            ponto.data()
                    ),
                    estilos.texto()
            );

            criarCelulaMonetaria(
                    linha,
                    1,
                    ponto.totalAReceber(),
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    2,
                    ponto.totalAPagar(),
                    estilos.moeda()
            );

            criarCelulaMonetaria(
                    linha,
                    3,
                    ponto.diferencaPrevista(),
                    estilos.moeda()
            );
        }

        configurarTabela(
                planilha,
                4,
                linhaAtual
        );
    }

    private int adicionarSecao(
            Sheet planilha,
            int indiceLinha,
            String texto,
            EstilosExcel estilos) {

        Row linha =
                planilha.createRow(
                        indiceLinha
                );

        Cell celula =
                linha.createCell(0);

        celula.setCellValue(texto);
        celula.setCellStyle(
                estilos.secao()
        );

        return indiceLinha + 1;
    }

    private int adicionarInformacao(
            Sheet planilha,
            int indiceLinha,
            String nome,
            String valor,
            EstilosExcel estilos) {

        Row linha =
                planilha.createRow(
                        indiceLinha
                );

        criarCelulaTexto(
                linha,
                0,
                nome,
                estilos.rotulo()
        );

        criarCelulaTexto(
                linha,
                1,
                valor,
                estilos.texto()
        );

        return indiceLinha + 1;
    }

    private int adicionarValorMonetario(
            Sheet planilha,
            int indiceLinha,
            String nome,
            BigDecimal valor,
            EstilosExcel estilos) {

        Row linha =
                planilha.createRow(
                        indiceLinha
                );

        criarCelulaTexto(
                linha,
                0,
                nome,
                estilos.rotulo()
        );

        criarCelulaMonetaria(
                linha,
                1,
                valor,
                estilos.moeda()
        );

        return indiceLinha + 1;
    }

    private int adicionarPercentual(
            Sheet planilha,
            int indiceLinha,
            String nome,
            BigDecimal valor,
            EstilosExcel estilos) {

        Row linha =
                planilha.createRow(
                        indiceLinha
                );

        criarCelulaTexto(
                linha,
                0,
                nome,
                estilos.rotulo()
        );

        if (valor == null) {
            criarCelulaTexto(
                    linha,
                    1,
                    "Não aplicável",
                    estilos.texto()
            );
        } else {
            Cell celula =
                    linha.createCell(1);

            celula.setCellValue(
                    valor.doubleValue() / 100.0
            );

            celula.setCellStyle(
                    estilos.percentual()
            );
        }

        return indiceLinha + 1;
    }

    private int adicionarNumero(
            Sheet planilha,
            int indiceLinha,
            String nome,
            long valor,
            EstilosExcel estilos) {

        Row linha =
                planilha.createRow(
                        indiceLinha
                );

        criarCelulaTexto(
                linha,
                0,
                nome,
                estilos.rotulo()
        );

        criarCelulaNumero(
                linha,
                1,
                valor,
                estilos.numero()
        );

        return indiceLinha + 1;
    }

    private void criarCabecalho(
            Sheet planilha,
            EstilosExcel estilos,
            String... titulos) {

        Row linha =
                planilha.createRow(0);

        for (
                int coluna = 0;
                coluna < titulos.length;
                coluna++
        ) {

            Cell celula =
                    linha.createCell(coluna);

            celula.setCellValue(
                    titulos[coluna]
            );

            celula.setCellStyle(
                    estilos.cabecalho()
            );
        }
    }

    private void criarCelulaTexto(
            Row linha,
            int coluna,
            String valor,
            CellStyle estilo) {

        Cell celula =
                linha.createCell(coluna);

        celula.setCellValue(
                valor == null
                        ? "-"
                        : valor
        );

        celula.setCellStyle(estilo);
    }

    private void criarCelulaMonetaria(
            Row linha,
            int coluna,
            BigDecimal valor,
            CellStyle estilo) {

        Cell celula =
                linha.createCell(coluna);

        celula.setCellValue(
                valor == null
                        ? 0.0
                        : valor.doubleValue()
        );

        celula.setCellStyle(estilo);
    }

    private void criarCelulaNumero(
            Row linha,
            int coluna,
            long valor,
            CellStyle estilo) {

        Cell celula =
                linha.createCell(coluna);

        celula.setCellValue(valor);
        celula.setCellStyle(estilo);
    }

    private void configurarTabela(
            Sheet planilha,
            int quantidadeColunas,
            int quantidadeLinhas) {

        planilha.createFreezePane(0, 1);

        if (quantidadeLinhas > 1) {
            planilha.setAutoFilter(
                    new org.apache.poi.ss.util.CellRangeAddress(
                            0,
                            quantidadeLinhas - 1,
                            0,
                            quantidadeColunas - 1
                    )
            );
        }

        for (
                int coluna = 0;
                coluna < quantidadeColunas;
                coluna++
        ) {
            planilha.autoSizeColumn(coluna);

            int larguraAtual =
                    planilha.getColumnWidth(
                            coluna
                    );

            int larguraMaxima =
                    45 * 256;

            if (
                    larguraAtual
                            > larguraMaxima
            ) {
                planilha.setColumnWidth(
                        coluna,
                        larguraMaxima
                );
            }
        }
    }

    private EstilosExcel criarEstilos(
            Workbook workbook) {

        Font fonteTitulo =
                workbook.createFont();

        fonteTitulo.setBold(true);
        fonteTitulo.setFontHeightInPoints(
                (short) 16
        );

        CellStyle titulo =
                workbook.createCellStyle();

        titulo.setFont(fonteTitulo);

        Font fonteCabecalho =
                workbook.createFont();

        fonteCabecalho.setBold(true);
        fonteCabecalho.setColor(
                IndexedColors.WHITE
                        .getIndex()
        );

        CellStyle cabecalho =
                workbook.createCellStyle();

        cabecalho.setFont(
                fonteCabecalho
        );

        cabecalho.setFillForegroundColor(
                IndexedColors.DARK_GREEN
                        .getIndex()
        );

        cabecalho.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        cabecalho.setAlignment(
                HorizontalAlignment.CENTER
        );

        aplicarBordas(cabecalho);

        Font fonteSecao =
                workbook.createFont();

        fonteSecao.setBold(true);

        CellStyle secao =
                workbook.createCellStyle();

        secao.setFont(fonteSecao);

        secao.setFillForegroundColor(
                IndexedColors.LIGHT_GREEN
                        .getIndex()
        );

        secao.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        aplicarBordas(secao);

        Font fonteRotulo =
                workbook.createFont();

        fonteRotulo.setBold(true);

        CellStyle rotulo =
                workbook.createCellStyle();

        rotulo.setFont(fonteRotulo);

        CellStyle texto =
                workbook.createCellStyle();

        texto.setWrapText(true);

        CellStyle moeda =
                workbook.createCellStyle();

        moeda.setDataFormat(
                workbook
                        .createDataFormat()
                        .getFormat(
                                "R$ #,##0.00;[Red]-R$ #,##0.00"
                        )
        );

        CellStyle percentual =
                workbook.createCellStyle();

        percentual.setDataFormat(
                workbook
                        .createDataFormat()
                        .getFormat(
                                "0.00%"
                        )
        );

        CellStyle numero =
                workbook.createCellStyle();

        numero.setDataFormat(
                workbook
                        .createDataFormat()
                        .getFormat("0")
        );

        return new EstilosExcel(
                titulo,
                cabecalho,
                secao,
                rotulo,
                texto,
                moeda,
                percentual,
                numero
        );
    }

    private void aplicarBordas(
            CellStyle estilo) {

        estilo.setBorderTop(
                BorderStyle.THIN
        );

        estilo.setBorderBottom(
                BorderStyle.THIN
        );

        estilo.setBorderLeft(
                BorderStyle.THIN
        );

        estilo.setBorderRight(
                BorderStyle.THIN
        );
    }

    private String formatarData(
            LocalDate data) {

        if (data == null) {
            return "-";
        }

        return data.format(
                FORMATADOR_DATA
        );
    }

    private String textoOuTraco(
            String texto) {

        if (
                texto == null
                        || texto.isBlank()
        ) {
            return "-";
        }

        return texto;
    }

    private record EstilosExcel(

            CellStyle titulo,
            CellStyle cabecalho,
            CellStyle secao,
            CellStyle rotulo,
            CellStyle texto,
            CellStyle moeda,
            CellStyle percentual,
            CellStyle numero

    ) {
    }
}