package br.com.fluxocaixa.fornecedor;

import br.com.fluxocaixa.contafinanceira.ContaFinanceira;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.produto.Produto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fornecedor_cotacoes")
public class CotacaoFornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "comprador_nome", length = 150)
    private String compradorNome;

    @Column(name = "data_cotacao", nullable = false)
    private LocalDate dataCotacao;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal quantidade;

    @Column(name = "unidade_medida", nullable = false, length = 30)
    private String unidadeMedida;

    @Column(name = "peso_total_kg", precision = 19, scale = 3)
    private BigDecimal pesoTotalKg;

    @Column(name = "valor_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "valor_por_kg", precision = 19, scale = 4)
    private BigDecimal valorPorKg;

    @Column(name = "valor_por_unidade", precision = 19, scale = 4)
    private BigDecimal valorPorUnidade;

    @Column(name = "valor_por_lote", precision = 19, scale = 2)
    private BigDecimal valorPorLote;

    @Column(precision = 19, scale = 2)
    private BigDecimal frete;

    @Column(precision = 19, scale = 2)
    private BigDecimal desconto;

    @Column(length = 500)
    private String observacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusCotacaoFornecedor status =
            StatusCotacaoFornecedor.COTACAO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimentacao_id")
    private Movimentacao movimentacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conta_financeira_id")
    private ContaFinanceira contaFinanceira;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected CotacaoFornecedor() {
    }

    public CotacaoFornecedor(
            Empresa empresa,
            Fornecedor fornecedor,
            Produto produto,
            String compradorNome,
            LocalDate dataCotacao,
            BigDecimal quantidade,
            String unidadeMedida,
            BigDecimal pesoTotalKg,
            BigDecimal valorTotal,
            BigDecimal frete,
            BigDecimal desconto,
            String observacao) {

        this.empresa = empresa;
        this.fornecedor = fornecedor;
        this.produto = produto;
        this.compradorNome = compradorNome;
        this.dataCotacao = dataCotacao;
        this.quantidade = quantidade;
        this.unidadeMedida = unidadeMedida;
        this.pesoTotalKg = resolverPesoTotalKg(
                quantidade,
                unidadeMedida,
                pesoTotalKg,
                produto.getPesoPadraoKg()
        );
        this.valorTotal = valorTotal;
        this.frete = valorOuZero(frete);
        this.desconto = valorOuZero(desconto);
        this.observacao = observacao;
        recalcularValores();
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public Produto getProduto() {
        return produto;
    }

    public String getCompradorNome() {
        return compradorNome;
    }

    public LocalDate getDataCotacao() {
        return dataCotacao;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public String getUnidadeMedida() {
        return unidadeMedida;
    }

    public BigDecimal getPesoTotalKg() {
        return pesoTotalKg;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public BigDecimal getValorLiquido() {
        return valorTotal
                .add(valorOuZero(frete))
                .subtract(valorOuZero(desconto));
    }

    public BigDecimal getValorPorKg() {
        return valorPorKg;
    }

    public BigDecimal getValorPorUnidade() {
        return valorPorUnidade;
    }

    public BigDecimal getValorPorLote() {
        return valorPorLote;
    }

    public BigDecimal getFrete() {
        return frete;
    }

    public BigDecimal getDesconto() {
        return desconto;
    }

    public String getObservacao() {
        return observacao;
    }

    public StatusCotacaoFornecedor getStatus() {
        return status;
    }

    public Movimentacao getMovimentacao() {
        return movimentacao;
    }

    public ContaFinanceira getContaFinanceira() {
        return contaFinanceira;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void marcarEnviadaAoFinanceiro(Movimentacao movimentacao) {
        this.movimentacao = movimentacao;
        this.status = StatusCotacaoFornecedor.ENVIADA_AO_FINANCEIRO;
    }

    public void marcarEnviadaAsContas(ContaFinanceira contaFinanceira) {
        this.contaFinanceira = contaFinanceira;
        this.status = StatusCotacaoFornecedor.ENVIADA_AS_CONTAS;
    }

    public boolean estaComoCotacao() {
        return status == StatusCotacaoFornecedor.COTACAO;
    }

    private void recalcularValores() {
        BigDecimal valorLiquido = getValorLiquido();

        valorPorUnidade = dividir(
                valorLiquido,
                quantidade,
                4
        );

        valorPorKg = dividir(
                valorLiquido,
                pesoTotalKg,
                4
        );

        valorPorLote = valorLiquido.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private BigDecimal resolverPesoTotalKg(
            BigDecimal quantidade,
            String unidadeMedida,
            BigDecimal pesoTotalKg,
            BigDecimal pesoPadraoKg) {

        if (pesoTotalKg != null
                && pesoTotalKg.compareTo(BigDecimal.ZERO) > 0) {
            return pesoTotalKg;
        }

        if (quantidade == null
                || quantidade.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        String unidade = unidadeMedida == null
                ? ""
                : unidadeMedida.trim().toLowerCase();

        if (unidade.equals("kg") || unidade.equals("quilo")) {
            return quantidade;
        }

        if (unidade.equals("tonelada")
                || unidade.equals("ton")
                || unidade.equals("t")) {
            return quantidade.multiply(BigDecimal.valueOf(1000));
        }

        if (pesoPadraoKg != null
                && pesoPadraoKg.compareTo(BigDecimal.ZERO) > 0) {
            return quantidade.multiply(pesoPadraoKg);
        }

        return null;
    }

    private BigDecimal dividir(
            BigDecimal valor,
            BigDecimal divisor,
            int escala) {

        if (valor == null
                || divisor == null
                || divisor.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        return valor.divide(
                divisor,
                escala,
                RoundingMode.HALF_UP
        );
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor == null
                ? BigDecimal.ZERO
                : valor;
    }
}
