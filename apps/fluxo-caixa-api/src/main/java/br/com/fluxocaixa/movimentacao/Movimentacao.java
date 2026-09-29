package br.com.fluxocaixa.movimentacao;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.colaboracao.AtividadeRural;
import br.com.fluxocaixa.colaboracao.PropriedadeRural;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.fornecedor.Fornecedor;
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
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacoes")
public class Movimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @Column(nullable = false, length = 150)
    private String descricao;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    @Column(name = "data_movimentacao", nullable = false)
    private LocalDate dataMovimentacao;

    @Column(length = 500)
    private String observacao;

    @Version
    @Column(nullable = false)
    private Long versao;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @Column(nullable = false)
    private boolean excluida = false;

    @Column(name = "excluida_em")
    private LocalDateTime excluidaEm;

    @Column(name = "categoria_original_nome", length = 100)
    private String categoriaOriginalNome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @Column(name = "fornecedor_nome", length = 150)
    private String fornecedorNome;

    @Column(name = "comprador_nome", length = 150)
    private String compradorNome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @Column(name = "produto_nome", length = 150)
    private String produtoNome;

    @Column(name = "produto_classificacao", length = 100)
    private String produtoClassificacao;

    @Column(precision = 19, scale = 3)
    private BigDecimal quantidade;

    @Column(name = "unidade_medida", length = 30)
    private String unidadeMedida;

    @Column(name = "valor_unitario", precision = 19, scale = 4)
    private BigDecimal valorUnitario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "propriedade_rural_id")
    private PropriedadeRural propriedadeRural;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atividade_rural_id")
    private AtividadeRural atividadeRural;

    protected Movimentacao() {
    }

    public Movimentacao(
            Empresa empresa,
            Categoria categoria,
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate dataMovimentacao,
            String observacao) {
        this(
                empresa,
                categoria,
                descricao,
                valor,
                tipo,
                dataMovimentacao,
                observacao,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    public Movimentacao(
            Empresa empresa,
            Categoria categoria,
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate dataMovimentacao,
            String observacao,
            Fornecedor fornecedor,
            String compradorNome,
            Produto produto,
            String produtoNome,
            String produtoClassificacao,
            BigDecimal quantidade,
            String unidadeMedida) {

        this(
                empresa,
                categoria,
                descricao,
                valor,
                tipo,
                dataMovimentacao,
                observacao,
                fornecedor,
                compradorNome,
                produto,
                produtoNome,
                produtoClassificacao,
                quantidade,
                unidadeMedida,
                null,
                null
        );
    }

    public Movimentacao(
            Empresa empresa,
            Categoria categoria,
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate dataMovimentacao,
            String observacao,
            Fornecedor fornecedor,
            String compradorNome,
            Produto produto,
            String produtoNome,
            String produtoClassificacao,
            BigDecimal quantidade,
            String unidadeMedida,
            PropriedadeRural propriedadeRural,
            AtividadeRural atividadeRural) {

        this.empresa = empresa;
        this.categoria = categoria;
        this.descricao = descricao;
        this.valor = valor;
        this.tipo = tipo;
        this.dataMovimentacao = dataMovimentacao;
        this.observacao = observacao;
        this.fornecedor = fornecedor;
        this.fornecedorNome = fornecedor == null
                ? null
                : fornecedor.getNome();
        this.compradorNome = compradorNome;
        this.produto = produto;
        this.produtoNome = produto == null
                ? produtoNome
                : produto.getNome();
        this.produtoClassificacao = produto == null
                ? produtoClassificacao
                : produto.getCategoria().getNome();
        this.quantidade = quantidade;
        this.unidadeMedida = unidadeMedida;
        this.valorUnitario = calcularValorUnitario(
                valor,
                quantidade
        );
        this.propriedadeRural = propriedadeRural;
        this.atividadeRural = atividadeRural;
    }

    public void moverParaLixeira() {
        this.categoriaOriginalNome = categoria == null
                ? categoriaOriginalNome
                : categoria.getNome();
        this.categoria = null;
        this.excluida = true;
        this.excluidaEm = LocalDateTime.now();
    }

    public void restaurar(Categoria categoria) {
        this.categoria = categoria;
        this.tipo = categoria.getTipo();
        this.excluida = false;
        this.excluidaEm = null;
        this.categoriaOriginalNome = null;
    }

    public void trocarCategoria(Categoria categoria) {
        this.categoria = categoria;
        this.tipo = categoria.getTipo();
    }

    public void atualizar(
            Categoria categoria,
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate dataMovimentacao,
            String observacao,
            Fornecedor fornecedor,
            String compradorNome,
            Produto produto,
            String produtoNome,
            String produtoClassificacao,
            BigDecimal quantidade,
            String unidadeMedida,
            PropriedadeRural propriedadeRural,
            AtividadeRural atividadeRural) {

        this.categoria = categoria;
        this.descricao = descricao;
        this.valor = valor;
        this.tipo = tipo;
        this.dataMovimentacao = dataMovimentacao;
        this.observacao = observacao;
        this.fornecedor = fornecedor;
        this.fornecedorNome = fornecedor == null
                ? null
                : fornecedor.getNome();
        this.compradorNome = compradorNome;
        this.produto = produto;
        this.produtoNome = produto == null
                ? produtoNome
                : produto.getNome();
        this.produtoClassificacao = produto == null
                ? produtoClassificacao
                : produto.getCategoria().getNome();
        this.quantidade = quantidade;
        this.unidadeMedida = unidadeMedida;
        this.valorUnitario = calcularValorUnitario(
                valor,
                quantidade
        );
        this.propriedadeRural = propriedadeRural;
        this.atividadeRural = atividadeRural;
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public LocalDate getDataMovimentacao() {
        return dataMovimentacao;
    }

    public String getObservacao() {
        return observacao;
    }

    public Long getVersao() {
        return versao;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public boolean isExcluida() {
        return excluida;
    }

    public LocalDateTime getExcluidaEm() {
        return excluidaEm;
    }

    public String getCategoriaOriginalNome() {
        return categoriaOriginalNome;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public String getFornecedorNome() {
        return fornecedor == null
                ? fornecedorNome
                : fornecedor.getNome();
    }

    public String getCompradorNome() {
        return compradorNome;
    }

    public Produto getProduto() {
        return produto;
    }

    public String getProdutoNome() {
        return produto == null
                ? produtoNome
                : produto.getNome();
    }

    public String getProdutoClassificacao() {
        return produto == null
                ? produtoClassificacao
                : produto.getCategoria().getNome();
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public String getUnidadeMedida() {
        return unidadeMedida;
    }

    public BigDecimal getValorUnitario() {
        return valorUnitario;
    }

    public PropriedadeRural getPropriedadeRural() {
        return propriedadeRural;
    }

    public AtividadeRural getAtividadeRural() {
        return atividadeRural;
    }

    private BigDecimal calcularValorUnitario(
            BigDecimal valor,
            BigDecimal quantidade) {

        if (
                valor == null
                        || quantidade == null
                        || quantidade.compareTo(BigDecimal.ZERO) <= 0
        ) {
            return null;
        }

        return valor.divide(
                quantidade,
                4,
                RoundingMode.HALF_UP
        );
    }
}
