package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.usuario.Usuario;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_agro")
public class AuditoriaAgro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 80)
    private String acao;

    @Column(nullable = false, length = 80)
    private String entidade;

    @Column(name = "entidade_id")
    private Long entidadeId;

    @Column(length = 1000)
    private String detalhes;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected AuditoriaAgro() {
    }

    public AuditoriaAgro(
            Empresa empresa,
            Usuario usuario,
            String acao,
            String entidade,
            Long entidadeId,
            String detalhes) {

        this.empresa = empresa;
        this.usuario = usuario;
        this.acao = acao;
        this.entidade = entidade;
        this.entidadeId = entidadeId;
        this.detalhes = detalhes;
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public Usuario getUsuario() { return usuario; }
    public String getAcao() { return acao; }
    public String getEntidade() { return entidade; }
    public Long getEntidadeId() { return entidadeId; }
    public String getDetalhes() { return detalhes; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
