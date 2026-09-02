package br.com.fluxocaixa.relatorio;

import br.com.fluxocaixa.contafinanceira.ContaFinanceiraResponse;
import br.com.fluxocaixa.dashboard.PontoFluxoCaixaResponse;
import br.com.fluxocaixa.movimentacao.MovimentacaoResponse;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RelatorioPdfService {

    private static final DateTimeFormatter FORMATADOR_DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RelatorioGerencialService relatorioGerencialService;

    public RelatorioPdfService(
            RelatorioGerencialService relatorioGerencialService) {

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

        ByteArrayOutputStream saida =
                new ByteArrayOutputStream();

        Document documento =
                new Document(
                        PageSize.A4,
                        36,
                        36,
                        40,
                        40
                );

        try {
            PdfWriter.getInstance(
                    documento,
                    saida
            );

            documento.open();

            adicionarCabecalho(
                    documento,
                    dados
            );

            adicionarResumoExecutivo(
                    documento,
                    dados
            );

            adicionarCompromissos(
                    documento,
                    dados
            );

            adicionarComportamentoCaixa(
                    documento,
                    dados
            );

            adicionarAnaliseCategorias(
                    documento,
                    dados
            );

            adicionarContasAtencao(
                    documento,
                    dados
            );

            adicionarMovimentacoes(
                    documento,
                    dados
            );

            documento.close();

            return saida.toByteArray();

        } catch (DocumentException exception) {

            if (documento.isOpen()) {
                documento.close();
            }

            throw new IllegalStateException(
                    "Não foi possível gerar o relatório PDF",
                    exception
            );
        }
    }

    private void adicionarCabecalho(
            Document documento,
            DadosRelatorioGerencial dados) {

        Font fonteTitulo =
                FontFactory.getFont(
                        FontFactory.HELVETICA_BOLD,
                        17,
                        new Color(31, 78, 45)
                );

        Font fonteSubtitulo =
                FontFactory.getFont(
                        FontFactory.HELVETICA,
                        10,
                        Color.DARK_GRAY
                );

        Paragraph titulo =
                new Paragraph(
                        "RELATÓRIO FINANCEIRO GERENCIAL",
                        fonteTitulo
                );

        titulo.setAlignment(
                Element.ALIGN_CENTER
        );

        titulo.setSpacingAfter(8);

        documento.add(titulo);

        Paragraph empresa =
                new Paragraph(
                        dados.empresa().nome(),
                        FontFactory.getFont(
                                FontFactory.HELVETICA_BOLD,
                                12
                        )
                );

        empresa.setAlignment(
                Element.ALIGN_CENTER
        );

        documento.add(empresa);

        Paragraph periodo =
                new Paragraph(
                        "Período: "
                                + formatarData(
                                dados.dataInicial()
                        )
                                + " a "
                                + formatarData(
                                dados.dataFinal()
                        ),
                        fonteSubtitulo
                );

        periodo.setAlignment(
                Element.ALIGN_CENTER
        );

        periodo.setSpacingAfter(18);

        documento.add(periodo);
    }

    private void adicionarResumoExecutivo(
            Document documento,
            DadosRelatorioGerencial dados) {

        adicionarTituloSecao(
                documento,
                "1. Resultado realizado"
        );

        PdfPTable tabela =
                criarTabela(2);

        adicionarLinhaIndicador(
                tabela,
                "Receitas realizadas",
                formatarMoeda(
                        dados.resumoRealizado()
                                .totalEntrou()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Despesas realizadas",
                formatarMoeda(
                        dados.resumoRealizado()
                                .totalSaiu()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Resultado do período",
                formatarMoeda(
                        dados.resumoRealizado()
                                .quantoSobrou()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Margem de lucro",
                formatarPercentual(
                        dados.resumoRealizado()
                                .margemLucro()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Ganho sobre custo",
                formatarPercentual(
                        dados.resumoRealizado()
                                .ganhoSobreCusto()
                )
        );

        documento.add(tabela);

        adicionarDiagnosticoResultado(
                documento,
                dados
        );
    }

    private void adicionarCompromissos(
            Document documento,
            DadosRelatorioGerencial dados) {

        adicionarTituloSecao(
                documento,
                "2. Compromissos financeiros"
        );

        PdfPTable tabela =
                criarTabela(2);

        adicionarLinhaIndicador(
                tabela,
                "A receber no período",
                formatarMoeda(
                        dados.resumoContas()
                                .totalAReceber()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "A pagar no período",
                formatarMoeda(
                        dados.resumoContas()
                                .totalAPagar()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Diferença prevista",
                formatarMoeda(
                        dados.resumoContas()
                                .diferencaPrevista()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Contas vencidas",
                String.valueOf(
                        dados.resumoContas()
                                .quantidadeVencidas()
                )
        );

        adicionarLinhaIndicador(
                tabela,
                "Lembretes ativos",
                String.valueOf(
                        dados.resumoContas()
                                .quantidadeLembretes()
                )
        );

        documento.add(tabela);

        String previsao =
                dados.resumoContas()
                        .previsaoPositiva()
                        ? "A previsão financeira do período é positiva."
                        : "A previsão financeira do período exige atenção.";

        adicionarObservacao(
                documento,
                previsao
        );
    }

    private void adicionarComportamentoCaixa(
            Document documento,
            DadosRelatorioGerencial dados) {

        adicionarTituloSecao(
                documento,
                "3. Comportamento do caixa"
        );

        List<PontoFluxoCaixaResponse> diasComMovimento =
                dados.fluxoCaixa()
                        .stream()
                        .filter(
                                ponto ->
                                        valor(
                                                ponto.totalReceitas()
                                        ).compareTo(
                                                BigDecimal.ZERO
                                        ) != 0
                                                ||
                                                valor(
                                                        ponto.totalDespesas()
                                                ).compareTo(
                                                        BigDecimal.ZERO
                                                ) != 0
                        )
                        .toList();

        if (diasComMovimento.isEmpty()) {
            adicionarObservacao(
                    documento,
                    "Não houve movimentação financeira no período."
            );
            return;
        }

        PdfPTable tabela =
                new PdfPTable(
                        new float[]{
                                1.3f,
                                1.7f,
                                1.7f,
                                1.7f
                        }
                );

        tabela.setWidthPercentage(100);

        adicionarCabecalhoTabela(
                tabela,
                "Data",
                "Receitas",
                "Despesas",
                "Saldo"
        );

        for (
                PontoFluxoCaixaResponse ponto
                : diasComMovimento
        ) {
            adicionarCelula(
                    tabela,
                    formatarData(
                            ponto.data()
                    )
            );

            adicionarCelula(
                    tabela,
                    formatarMoeda(
                            ponto.totalReceitas()
                    )
            );

            adicionarCelula(
                    tabela,
                    formatarMoeda(
                            ponto.totalDespesas()
                    )
            );

            adicionarCelula(
                    tabela,
                    formatarMoeda(
                            ponto.saldoDoDia()
                    )
            );
        }

        documento.add(tabela);
    }

    private void adicionarAnaliseCategorias(
            Document documento,
            DadosRelatorioGerencial dados) {

        adicionarTituloSecao(
                documento,
                "4. Principais categorias"
        );

        Map<String, BigDecimal> despesas =
                dados.movimentacoes()
                        .stream()
                        .filter(
                                movimentacao ->
                                        movimentacao.tipo()
                                                == TipoMovimentacao.DESPESA
                        )
                        .collect(
                                Collectors.groupingBy(
                                        MovimentacaoResponse::categoriaNome,
                                        Collectors.reducing(
                                                BigDecimal.ZERO,
                                                MovimentacaoResponse::valor,
                                                BigDecimal::add
                                        )
                                )
                        );

        if (despesas.isEmpty()) {
            adicionarObservacao(
                    documento,
                    "Não houve despesas classificadas no período."
            );
            return;
        }

        BigDecimal totalDespesas =
                despesas.values()
                        .stream()
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        List<Map.Entry<String, BigDecimal>>
                maioresDespesas =
                despesas.entrySet()
                        .stream()
                        .sorted(
                                Map.Entry
                                        .<String, BigDecimal>
                                                comparingByValue()
                                        .reversed()
                        )
                        .limit(5)
                        .toList();

        PdfPTable tabela =
                new PdfPTable(
                        new float[]{
                                3f,
                                2f,
                                1.5f
                        }
                );

        tabela.setWidthPercentage(100);

        adicionarCabecalhoTabela(
                tabela,
                "Categoria",
                "Total",
                "% despesas"
        );

        for (
                Map.Entry<String, BigDecimal> categoria
                : maioresDespesas
        ) {

            BigDecimal percentual =
                    BigDecimal.ZERO;

            if (
                    totalDespesas.compareTo(
                            BigDecimal.ZERO
                    ) > 0
            ) {
                percentual =
                        categoria.getValue()
                                .multiply(
                                        BigDecimal.valueOf(
                                                100
                                        )
                                )
                                .divide(
                                        totalDespesas,
                                        2,
                                        RoundingMode.HALF_UP
                                );
            }

            adicionarCelula(
                    tabela,
                    categoria.getKey()
            );

            adicionarCelula(
                    tabela,
                    formatarMoeda(
                            categoria.getValue()
                    )
            );

            adicionarCelula(
                    tabela,
                    percentual
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            )
                            .toPlainString()
                            + "%"
            );
        }

        documento.add(tabela);
    }

    private void adicionarContasAtencao(
            Document documento,
            DadosRelatorioGerencial dados) {

        adicionarTituloSecao(
                documento,
                "5. Contas que exigem atenção"
        );

        List<ContaFinanceiraResponse> contas =
                java.util.stream.Stream
                        .concat(
                                dados.contasAPagar()
                                        .stream(),
                                dados.contasAReceber()
                                        .stream()
                        )
                        .filter(
                                conta ->
                                        conta.vencida()
                                                ||
                                                conta.exibirLembrete()
                        )
                        .sorted(
                                Comparator.comparing(
                                        ContaFinanceiraResponse
                                                ::dataVencimento
                                )
                        )
                        .limit(10)
                        .toList();

        if (contas.isEmpty()) {
            adicionarObservacao(
                    documento,
                    "Não existem contas do período exigindo atenção imediata."
            );
            return;
        }

        PdfPTable tabela =
                new PdfPTable(
                        new float[]{
                                1.2f,
                                1.4f,
                                2.6f,
                                1.5f,
                                1.3f
                        }
                );

        tabela.setWidthPercentage(100);

        adicionarCabecalhoTabela(
                tabela,
                "Tipo",
                "Vencimento",
                "Descrição",
                "Pendente",
                "Situação"
        );

        for (
                ContaFinanceiraResponse conta
                : contas
        ) {

            adicionarCelula(
                    tabela,
                    conta.tipoDescricao()
            );

            adicionarCelula(
                    tabela,
                    formatarData(
                            conta.dataVencimento()
                    )
            );

            adicionarCelula(
                    tabela,
                    conta.descricao()
            );

            adicionarCelula(
                    tabela,
                    formatarMoeda(
                            conta.valorPendente()
                    )
            );

            adicionarCelula(
                    tabela,
                    conta.vencida()
                            ? "VENCIDA"
                            : conta.situacaoDescricao()
            );
        }

        documento.add(tabela);
    }

    private void adicionarMovimentacoes(
            Document documento,
            DadosRelatorioGerencial dados) {

        adicionarTituloSecao(
                documento,
                "6. Movimentações do período"
        );

        if (dados.movimentacoes().isEmpty()) {
            adicionarObservacao(
                    documento,
                    "Não houve movimentações no período."
            );
            return;
        }

        PdfPTable tabela =
                new PdfPTable(
                        new float[]{
                                1.2f,
                                1.3f,
                                1.8f,
                                3f,
                                1.5f
                        }
                );

        tabela.setWidthPercentage(100);

        adicionarCabecalhoTabela(
                tabela,
                "Data",
                "Tipo",
                "Categoria",
                "Descrição",
                "Valor"
        );

        for (
                MovimentacaoResponse movimentacao
                : dados.movimentacoes()
        ) {

            adicionarCelula(
                    tabela,
                    formatarData(
                            movimentacao
                                    .dataMovimentacao()
                    )
            );

            adicionarCelula(
                    tabela,
                    movimentacao.explicacao()
            );

            adicionarCelula(
                    tabela,
                    movimentacao.categoriaNome()
            );

            adicionarCelula(
                    tabela,
                    movimentacao.descricao()
            );

            adicionarCelula(
                    tabela,
                    formatarMoeda(
                            movimentacao.valor()
                    )
            );
        }

        documento.add(tabela);
    }

    private void adicionarDiagnosticoResultado(
            Document documento,
            DadosRelatorioGerencial dados) {

        BigDecimal resultado =
                valor(
                        dados.resumoRealizado()
                                .quantoSobrou()
                );

        String mensagem;

        if (
                resultado.compareTo(
                        BigDecimal.ZERO
                ) > 0
        ) {
            mensagem =
                    "O período apresentou resultado financeiro positivo de "
                            + formatarMoeda(resultado)
                            + ".";
        } else if (
                resultado.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {
            mensagem =
                    "O período apresentou resultado financeiro negativo de "
                            + formatarMoeda(
                            resultado.abs()
                    )
                            + ". As despesas realizadas superaram as receitas.";
        } else {
            mensagem =
                    "O período terminou com equilíbrio entre receitas e despesas realizadas.";
        }

        adicionarObservacao(
                documento,
                mensagem
        );
    }

    private void adicionarTituloSecao(
            Document documento,
            String titulo) {

        Paragraph paragrafo =
                new Paragraph(
                        titulo,
                        FontFactory.getFont(
                                FontFactory.HELVETICA_BOLD,
                                12,
                                new Color(
                                        31,
                                        78,
                                        45
                                )
                        )
                );

        paragrafo.setSpacingBefore(14);
        paragrafo.setSpacingAfter(7);

        documento.add(paragrafo);
    }

    private PdfPTable criarTabela(
            int colunas) {

        PdfPTable tabela =
                new PdfPTable(colunas);

        tabela.setWidthPercentage(100);

        return tabela;
    }

    private void adicionarLinhaIndicador(
            PdfPTable tabela,
            String indicador,
            String valor) {

        PdfPCell nome =
                new PdfPCell(
                        new Phrase(
                                indicador,
                                FontFactory.getFont(
                                        FontFactory.HELVETICA_BOLD,
                                        9
                                )
                        )
                );

        nome.setPadding(6);

        PdfPCell resultado =
                new PdfPCell(
                        new Phrase(
                                valor,
                                FontFactory.getFont(
                                        FontFactory.HELVETICA,
                                        9
                                )
                        )
                );

        resultado.setPadding(6);
        resultado.setHorizontalAlignment(
                Element.ALIGN_RIGHT
        );

        tabela.addCell(nome);
        tabela.addCell(resultado);
    }

    private void adicionarCabecalhoTabela(
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

            celula.setBackgroundColor(
                    new Color(
                            31,
                            78,
                            45
                    )
            );

            celula.setPadding(5);
            celula.setHorizontalAlignment(
                    Element.ALIGN_CENTER
            );

            tabela.addCell(celula);
        }

        tabela.setHeaderRows(1);
    }

    private void adicionarCelula(
            PdfPTable tabela,
            String texto) {

        PdfPCell celula =
                new PdfPCell(
                        new Phrase(
                                texto == null
                                        ? "-"
                                        : texto,
                                FontFactory.getFont(
                                        FontFactory.HELVETICA,
                                        8
                                )
                        )
                );

        celula.setPadding(5);

        tabela.addCell(celula);
    }

    private void adicionarObservacao(
            Document documento,
            String texto) {

        Paragraph paragrafo =
                new Paragraph(
                        texto,
                        FontFactory.getFont(
                                FontFactory.HELVETICA,
                                9,
                                Color.DARK_GRAY
                        )
                );

        paragrafo.setSpacingBefore(6);
        paragrafo.setSpacingAfter(4);

        documento.add(paragrafo);
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

    private String formatarMoeda(
            BigDecimal valor) {

        BigDecimal numero =
                valor(valor)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        String texto =
                numero.abs()
                        .toPlainString();

        String[] partes =
                texto.split("\\.");

        String inteira =
                partes[0];

        StringBuilder formatada =
                new StringBuilder();

        for (
                int indice = 0;
                indice < inteira.length();
                indice++
        ) {

            if (
                    indice > 0
                            &&
                            (
                                    inteira.length()
                                            - indice
                            ) % 3 == 0
            ) {
                formatada.append(".");
            }

            formatada.append(
                    inteira.charAt(indice)
            );
        }

        String centavos =
                partes.length > 1
                        ? partes[1]
                        : "00";

        String resultado =
                "R$ "
                        + formatada
                        + ","
                        + centavos;

        if (
                numero.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {
            return "-" + resultado;
        }

        return resultado;
    }

    private String formatarPercentual(
            BigDecimal valor) {

        if (valor == null) {
            return "Não aplicável";
        }

        return valor
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                )
                .toPlainString()
                .replace(".", ",")
                + "%";
    }

    private BigDecimal valor(
            BigDecimal valor) {

        return valor == null
                ? BigDecimal.ZERO
                : valor;
    }
}