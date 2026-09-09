package br.com.fluxocaixa.contafinanceira;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.empresa.Empresa;
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
import br.com.fluxocaixa.movimentacao.Movimentacao;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contas_financeiras")
public class ContaFinanceira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "empresa_id",
            nullable = false
    )
    private Empresa empresa;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "categoria_id",
            nullable = false
    )
    private Categoria categoria;

    @Column(
            nullable = false,
            length = 150
    )
    private String descricao;

    @Column(length = 150)
    private String favorecido;

    @Column(
            name = "numero_documento",
            length = 80
    )
    private String numeroDocumento;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private TipoContaFinanceira tipo;

    @Column(
            name = "valor_total",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal valorTotal;

    @Column(
            name = "valor_liquidado",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal valorLiquidado =
            BigDecimal.ZERO;

    @Column(
            name = "data_emissao",
            nullable = false
    )
    private LocalDate dataEmissao;

    @Column(
            name = "data_vencimento",
            nullable = false
    )
    private LocalDate dataVencimento;

    @Column(name = "data_liquidacao")
    private LocalDate dataLiquidacao;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private SituacaoContaFinanceira situacao =
            SituacaoContaFinanceira.PENDENTE;

    @Column(
            name = "lembrete_ativo",
            nullable = false
    )
    private boolean lembreteAtivo = true;

    @Column(
            name = "antecedencia_lembrete_dias",
            nullable = false
    )
    private int antecedenciaLembreteDias = 2;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private boolean excluida = false;

    @Column(name = "excluida_em")
    private LocalDateTime excluidaEm;

    @Column(
            name = "categoria_original_nome",
            length = 100
    )
    private String categoriaOriginalNome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimentacao_financeiro_id")
    private Movimentacao movimentacaoFinanceiro;

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    @CreationTimestamp
    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(
            name = "atualizado_em",
            nullable = false
    )
    private LocalDateTime atualizadoEm;

    protected ContaFinanceira() {
    }

    public ContaFinanceira(
            Empresa empresa,
            Categoria categoria,
            String descricao,
            String favorecido,
            String numeroDocumento,
            TipoContaFinanceira tipo,
            BigDecimal valorTotal,
            LocalDate dataEmissao,
            LocalDate dataVencimento,
            String observacao) {

        this.empresa = empresa;
        this.categoria = categoria;
        this.descricao = descricao;
        this.favorecido = favorecido;
        this.numeroDocumento = numeroDocumento;
        this.tipo = tipo;
        this.valorTotal = valorTotal;
        this.dataEmissao = dataEmissao;
        this.dataVencimento = dataVencimento;
        this.observacao = observacao;
        this.valorLiquidado = BigDecimal.ZERO;

        this.situacao =
                SituacaoContaFinanceira.PENDENTE;

        this.lembreteAtivo = true;
        this.antecedenciaLembreteDias = 2;
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

    public String getFavorecido() {
        return favorecido;
    }

    public String getNumeroDocumento() {
        return numeroDocumento;
    }

    public TipoContaFinanceira getTipo() {
        return tipo;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public BigDecimal getValorLiquidado() {
        return valorLiquidado;
    }

    public BigDecimal getValorPendente() {
        return valorTotal.subtract(
                valorLiquidado
        );
    }

    public LocalDate getDataEmissao() {
        return dataEmissao;
    }

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public LocalDate getDataLiquidacao() {
        return dataLiquidacao;
    }

    public SituacaoContaFinanceira getSituacao() {
        return situacao;
    }

    public boolean isLembreteAtivo() {
        return lembreteAtivo;
    }

    public int getAntecedenciaLembreteDias() {
        return antecedenciaLembreteDias;
    }

    public String getObservacao() {
        return observacao;
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

    public Movimentacao getMovimentacaoFinanceiro() {
        return movimentacaoFinanceiro;
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

    public boolean estaVencida(
            LocalDate dataAtual) {

        return situacao !=
                SituacaoContaFinanceira.QUITADA
                && situacao !=
                SituacaoContaFinanceira.CANCELADA
                && dataVencimento.isBefore(
                dataAtual
        );
    }

    public boolean deveExibirLembrete(
            LocalDate dataAtual) {

        if (!lembreteAtivo) {
            return false;
        }

        if (
                situacao ==
                        SituacaoContaFinanceira.QUITADA
                        || situacao ==
                        SituacaoContaFinanceira.CANCELADA
        ) {
            return false;
        }

        LocalDate inicioDoLembrete =
                dataVencimento.minusDays(
                        antecedenciaLembreteDias
                );

        return !dataAtual.isBefore(
                inicioDoLembrete
        );
    }

    public void alterarDados(
            Categoria categoria,
            String descricao,
            String favorecido,
            String numeroDocumento,
            BigDecimal valorTotal,
            LocalDate dataEmissao,
            LocalDate dataVencimento,
            String observacao) {

        if (
                valorTotal.compareTo(
                        valorLiquidado
                ) < 0
        ) {
            throw new IllegalArgumentException(
                    "O valor total não pode ser menor "
                            + "que o valor já quitado"
            );
        }

        this.categoria = categoria;
        this.descricao = descricao;
        this.favorecido = favorecido;
        this.numeroDocumento = numeroDocumento;
        this.valorTotal = valorTotal;
        this.dataEmissao = dataEmissao;
        this.dataVencimento = dataVencimento;
        this.observacao = observacao;

        atualizarSituacaoAposAlteracao();
    }

    public void registrarLiquidacao(
            BigDecimal valor,
            LocalDate data) {

        if (
                situacao ==
                        SituacaoContaFinanceira.CANCELADA
        ) {
            throw new IllegalStateException(
                    "Não é possível quitar "
                            + "uma conta cancelada"
            );
        }

        if (
                situacao ==
                        SituacaoContaFinanceira.QUITADA
        ) {
            throw new IllegalStateException(
                    "Esta conta já está quitada"
            );
        }

        if (
                valor == null
                        || valor.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {
            throw new IllegalArgumentException(
                    "O valor da quitação deve ser "
                            + "maior que zero"
            );
        }

        BigDecimal novoValorLiquidado =
                valorLiquidado.add(valor);

        if (
                novoValorLiquidado.compareTo(
                        valorTotal
                ) > 0
        ) {
            throw new IllegalArgumentException(
                    "O valor informado é maior "
                            + "que o valor pendente"
            );
        }

        valorLiquidado = novoValorLiquidado;

        if (
                valorLiquidado.compareTo(
                        valorTotal
                ) == 0
        ) {
            situacao =
                    SituacaoContaFinanceira.QUITADA;

            dataLiquidacao = data;
            lembreteAtivo = false;
        } else {
            situacao =
                    SituacaoContaFinanceira.PARCIAL;

            dataLiquidacao = null;
        }
    }

    public void cancelar() {

        if (
                situacao ==
                        SituacaoContaFinanceira.QUITADA
        ) {
            throw new IllegalStateException(
                    "Uma conta quitada "
                            + "não pode ser cancelada"
            );
        }

        situacao =
                SituacaoContaFinanceira.CANCELADA;

        lembreteAtivo = false;
    }

    public void moverParaLixeira() {
        this.categoriaOriginalNome =
                categoria == null
                        ? categoriaOriginalNome
                        : categoria.getNome();

        this.excluida = true;
        this.excluidaEm = LocalDateTime.now();
        this.lembreteAtivo = false;
    }

    public void restaurarDaLixeira() {
        this.excluida = false;
        this.excluidaEm = null;
    }

    public void trocarCategoria(Categoria categoria) {
        this.categoria = categoria;
        this.tipo =
                categoria.getTipo()
                        == br.com.fluxocaixa.movimentacao.TipoMovimentacao.RECEITA
                        ? TipoContaFinanceira.RECEBER
                        : TipoContaFinanceira.PAGAR;
        this.categoriaOriginalNome = null;
    }

    public void marcarEnviadaAoFinanceiro(
            Movimentacao movimentacao,
            LocalDate dataLiquidacao) {

        this.movimentacaoFinanceiro = movimentacao;
        this.valorLiquidado = this.valorTotal;
        this.situacao = SituacaoContaFinanceira.QUITADA;
        this.dataLiquidacao = dataLiquidacao;
        this.lembreteAtivo = false;
    }

    public void ativarLembrete(
            int antecedenciaDias) {

        if (
                antecedenciaDias < 0
                        || antecedenciaDias > 365
        ) {
            throw new IllegalArgumentException(
                    "A antecedência do lembrete deve "
                            + "estar entre 0 e 365 dias"
            );
        }

        if (
                situacao ==
                        SituacaoContaFinanceira.QUITADA
                        || situacao ==
                        SituacaoContaFinanceira.CANCELADA
        ) {
            throw new IllegalStateException(
                    "Não é possível ativar "
                            + "o lembrete desta conta"
            );
        }

        lembreteAtivo = true;

        antecedenciaLembreteDias =
                antecedenciaDias;
    }

    public void desativarLembrete() {
        lembreteAtivo = false;
    }

    private void atualizarSituacaoAposAlteracao() {

        if (
                situacao ==
                        SituacaoContaFinanceira.CANCELADA
        ) {
            return;
        }

        if (
                valorLiquidado.compareTo(
                        BigDecimal.ZERO
                ) == 0
        ) {
            situacao =
                    SituacaoContaFinanceira.PENDENTE;

            dataLiquidacao = null;
            return;
        }

        if (
                valorLiquidado.compareTo(
                        valorTotal
                ) == 0
        ) {
            situacao =
                    SituacaoContaFinanceira.QUITADA;

            lembreteAtivo = false;
            return;
        }

        situacao =
                SituacaoContaFinanceira.PARCIAL;

        dataLiquidacao = null;
    }
}
