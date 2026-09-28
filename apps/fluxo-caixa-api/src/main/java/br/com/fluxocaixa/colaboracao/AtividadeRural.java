package br.com.fluxocaixa.colaboracao;

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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "atividades_rurais")
public class AtividadeRural {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 120)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoAtividadeRural tipo;

    @Column(nullable = false)
    private boolean ativa = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected AtividadeRural() {
    }

    public AtividadeRural(
            Empresa empresa,
            String nome,
            TipoAtividadeRural tipo) {

        this.empresa = empresa;
        this.nome = nome;
        this.tipo = tipo;
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public String getNome() { return nome; }
    public TipoAtividadeRural getTipo() { return tipo; }
    public boolean isAtiva() { return ativa; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
