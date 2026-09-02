package br.com.fluxocaixa.contafinanceira;

import br.com.fluxocaixa.movimentacao.Movimentacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "liquidacoes_contas")
public class LiquidacaoConta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "conta_financeira_id",
            nullable = false
    )
    private ContaFinanceira contaFinanceira;

    @OneToOne(
            fetch = FetchType.LAZY,
            optional = true
    )
    @JoinColumn(
            name = "movimentacao_id",
            nullable = true,
            unique = true
    )
    private Movimentacao movimentacao;

    @Column(
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal valor;

    @Column(
            name = "data_liquidacao",
            nullable = false
    )
    private LocalDate dataLiquidacao;

    @Column(length = 500)
    private String observacao;

    @CreationTimestamp
    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private LocalDateTime criadoEm;

    protected LiquidacaoConta() {
    }

    public LiquidacaoConta(
            ContaFinanceira contaFinanceira,
            Movimentacao movimentacao,
            BigDecimal valor,
            LocalDate dataLiquidacao,
            String observacao) {

        this.contaFinanceira =
                contaFinanceira;

        this.movimentacao =
                movimentacao;

        this.valor = valor;

        this.dataLiquidacao =
                dataLiquidacao;

        this.observacao = observacao;
    }

    public Long getId() {
        return id;
    }

    public ContaFinanceira getContaFinanceira() {
        return contaFinanceira;
    }

    public Movimentacao getMovimentacao() {
        return movimentacao;
    }

    public boolean foiLancadaNoControleFinanceiro() {
        return movimentacao != null;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public LocalDate getDataLiquidacao() {
        return dataLiquidacao;
    }

    public String getObservacao() {
        return observacao;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
