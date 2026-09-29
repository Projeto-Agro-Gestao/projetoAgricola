package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
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
@Table(name = "parametros_tributarios")
public class ParametroTributario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RegimeTributario regime;

    @Column(nullable = false, length = 20)
    private String competencia;

    @Column(length = 80)
    private String nome;

    @Column(name = "aliquota_percentual", precision = 9, scale = 4)
    private BigDecimal aliquotaPercentual;

    @Column(name = "parcela_deduzir", precision = 19, scale = 2)
    private BigDecimal parcelaDeduzir;

    @Column(length = 1000)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_usuario_id")
    private Usuario criadoPor;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected ParametroTributario() {
    }

    public ParametroTributario(
            Empresa empresa,
            RegimeTributario regime,
            String competencia,
            String nome,
            BigDecimal aliquotaPercentual,
            BigDecimal parcelaDeduzir,
            String observacao,
            Usuario criadoPor) {
        this.empresa = empresa;
        this.regime = regime;
        this.competencia = competencia;
        this.nome = nome;
        this.aliquotaPercentual = aliquotaPercentual;
        this.parcelaDeduzir = parcelaDeduzir;
        this.observacao = observacao;
        this.criadoPor = criadoPor;
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public RegimeTributario getRegime() { return regime; }
    public String getCompetencia() { return competencia; }
    public String getNome() { return nome; }
    public BigDecimal getAliquotaPercentual() { return aliquotaPercentual; }
    public BigDecimal getParcelaDeduzir() { return parcelaDeduzir; }
    public String getObservacao() { return observacao; }
}
