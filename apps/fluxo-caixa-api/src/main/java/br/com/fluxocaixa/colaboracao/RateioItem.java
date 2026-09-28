package br.com.fluxocaixa.colaboracao;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "rateio_itens")
public class RateioItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rateio_id", nullable = false)
    private Rateio rateio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "propriedade_rural_id")
    private PropriedadeRural propriedadeRural;

    @Column(length = 150)
    private String descricao;

    @Column(precision = 9, scale = 4)
    private BigDecimal percentual;

    @Column(precision = 19, scale = 2)
    private BigDecimal valor;

    protected RateioItem() {
    }

    public RateioItem(
            PropriedadeRural propriedadeRural,
            String descricao,
            BigDecimal percentual,
            BigDecimal valor) {

        this.propriedadeRural = propriedadeRural;
        this.descricao = descricao;
        this.percentual = percentual;
        this.valor = valor;
    }

    void definirRateio(Rateio rateio) {
        this.rateio = rateio;
    }

    public Long getId() { return id; }
    public Rateio getRateio() { return rateio; }
    public PropriedadeRural getPropriedadeRural() { return propriedadeRural; }
    public String getDescricao() { return descricao; }
    public BigDecimal getPercentual() { return percentual; }
    public BigDecimal getValor() { return valor; }
}
