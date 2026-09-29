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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "regimes_tributarios_empresa")
public class RegimeTributarioEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RegimeTributario regime;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim;

    @Column(length = 20)
    private String competencia;

    @Column(nullable = false, length = 30)
    private String situacao = "ATIVO";

    @Column(length = 1000)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_usuario_id")
    private Usuario responsavel;

    @Column(name = "revisado_em")
    private LocalDateTime revisadoEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected RegimeTributarioEmpresa() {
    }

    public RegimeTributarioEmpresa(
            Empresa empresa,
            RegimeTributario regime,
            LocalDate dataInicio,
            LocalDate dataFim,
            String competencia,
            String observacao,
            Usuario responsavel) {
        this.empresa = empresa;
        this.regime = regime;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.competencia = competencia;
        this.observacao = observacao;
        this.responsavel = responsavel;
        this.revisadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public RegimeTributario getRegime() { return regime; }
    public LocalDate getDataInicio() { return dataInicio; }
    public LocalDate getDataFim() { return dataFim; }
    public String getCompetencia() { return competencia; }
    public String getSituacao() { return situacao; }
    public String getObservacao() { return observacao; }
    public Usuario getResponsavel() { return responsavel; }
    public LocalDateTime getRevisadoEm() { return revisadoEm; }
}
