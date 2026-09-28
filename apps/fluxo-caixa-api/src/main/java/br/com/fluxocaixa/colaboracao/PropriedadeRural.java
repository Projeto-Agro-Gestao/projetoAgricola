package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "propriedades_rurais")
public class PropriedadeRural {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 100)
    private String municipio;

    @Column(length = 2)
    private String estado;

    @Column(name = "area_hectares", precision = 19, scale = 2)
    private BigDecimal areaHectares;

    @Column(nullable = false)
    private boolean ativa = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected PropriedadeRural() {
    }

    public PropriedadeRural(
            Empresa empresa,
            String nome,
            String municipio,
            String estado,
            BigDecimal areaHectares) {

        this.empresa = empresa;
        this.nome = nome;
        this.municipio = municipio;
        this.estado = estado;
        this.areaHectares = areaHectares;
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public String getNome() { return nome; }
    public String getMunicipio() { return municipio; }
    public String getEstado() { return estado; }
    public BigDecimal getAreaHectares() { return areaHectares; }
    public boolean isAtiva() { return ativa; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
