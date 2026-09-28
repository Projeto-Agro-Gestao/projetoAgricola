package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rateios")
public class Rateio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movimentacao_id", nullable = false)
    private Movimentacao movimentacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoRateio tipo = TipoRateio.PERCENTUAL;

    @Column(length = 500)
    private String observacao;

    @OneToMany(
            mappedBy = "rateio",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<RateioItem> itens = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Rateio() {
    }

    public Rateio(
            Empresa empresa,
            Movimentacao movimentacao,
            TipoRateio tipo,
            String observacao) {

        this.empresa = empresa;
        this.movimentacao = movimentacao;
        this.tipo = tipo;
        this.observacao = observacao;
    }

    public void adicionarItem(RateioItem item) {
        item.definirRateio(this);
        itens.add(item);
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public Movimentacao getMovimentacao() { return movimentacao; }
    public TipoRateio getTipo() { return tipo; }
    public String getObservacao() { return observacao; }
    public List<RateioItem> getItens() { return List.copyOf(itens); }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
