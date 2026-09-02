package br.com.fluxocaixa.movimentacao;

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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
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

        this.empresa = empresa;
        this.categoria = categoria;
        this.descricao = descricao;
        this.valor = valor;
        this.tipo = tipo;
        this.dataMovimentacao = dataMovimentacao;
        this.observacao = observacao;
    }

    public void atualizar(
            Categoria categoria,
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate dataMovimentacao,
            String observacao) {

        this.categoria = categoria;
        this.descricao = descricao;
        this.valor = valor;
        this.tipo = tipo;
        this.dataMovimentacao = dataMovimentacao;
        this.observacao = observacao;
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
}