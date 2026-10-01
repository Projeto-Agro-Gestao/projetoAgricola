package br.com.fluxocaixa.integracaooficial;

import br.com.fluxocaixa.colaboracao.RegimeTributario;
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

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tax_rules")
public class TaxRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id", nullable = false)
    private TaxSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RegimeTributario regime;

    @Column(nullable = false, length = 40)
    private String versao;

    @Column(length = 20)
    private String competencia;

    @Column(name = "vigencia_inicio", nullable = false)
    private LocalDate vigenciaInicio;

    @Column(name = "vigencia_fim")
    private LocalDate vigenciaFim;

    @Column(name = "aliquota_percentual", precision = 10, scale = 4)
    private BigDecimal aliquotaPercentual;

    @Column(name = "parcela_deduzir", precision = 15, scale = 2)
    private BigDecimal parcelaDeduzir;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TaxRuleStatus status = TaxRuleStatus.IMPORTADA;

    @Column(length = 1000)
    private String premissas;

    protected TaxRule() {
    }
}
