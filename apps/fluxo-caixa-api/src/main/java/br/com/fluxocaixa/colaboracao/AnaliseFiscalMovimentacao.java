package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.usuario.Usuario;
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
import java.time.LocalDateTime;

@Entity
@Table(name = "analises_fiscais_movimentacao")
public class AnaliseFiscalMovimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movimentacao_id", nullable = false)
    private Movimentacao movimentacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classificacao_contabil_id")
    private ClassificacaoContabil classificacaoContabil;

    @Enumerated(EnumType.STRING)
    @Column(name = "tratamento_fiscal", nullable = false, length = 40)
    private StatusTratamentoFiscal tratamentoFiscal =
            StatusTratamentoFiscal.PENDENTE_ANALISE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusAnaliseFiscal status = StatusAnaliseFiscal.PENDENTE;

    @Column(name = "valor_considerado", precision = 19, scale = 2)
    private BigDecimal valorConsiderado;

    @Column(length = 1000)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validado_por_usuario_id")
    private Usuario validadoPor;

    @Column(name = "validado_em")
    private LocalDateTime validadoEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected AnaliseFiscalMovimentacao() {
    }

    public AnaliseFiscalMovimentacao(Empresa empresa, Movimentacao movimentacao) {
        this.empresa = empresa;
        this.movimentacao = movimentacao;
    }

    public void atualizar(
            ClassificacaoContabil classificacaoContabil,
            StatusTratamentoFiscal tratamentoFiscal,
            StatusAnaliseFiscal status,
            BigDecimal valorConsiderado,
            String observacao,
            Usuario usuario) {
        this.classificacaoContabil = classificacaoContabil;
        this.tratamentoFiscal = tratamentoFiscal == null
                ? StatusTratamentoFiscal.PENDENTE_ANALISE
                : tratamentoFiscal;
        this.status = status == null
                ? StatusAnaliseFiscal.PENDENTE
                : status;
        this.valorConsiderado = valorConsiderado;
        this.observacao = observacao;

        if (this.status == StatusAnaliseFiscal.VALIDADO
                || this.status == StatusAnaliseFiscal.CONCLUIDO) {
            this.validadoPor = usuario;
            this.validadoEm = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public Movimentacao getMovimentacao() { return movimentacao; }
    public ClassificacaoContabil getClassificacaoContabil() { return classificacaoContabil; }
    public StatusTratamentoFiscal getTratamentoFiscal() { return tratamentoFiscal; }
    public StatusAnaliseFiscal getStatus() { return status; }
    public BigDecimal getValorConsiderado() { return valorConsiderado; }
    public String getObservacao() { return observacao; }
    public Usuario getValidadoPor() { return validadoPor; }
    public LocalDateTime getValidadoEm() { return validadoEm; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
