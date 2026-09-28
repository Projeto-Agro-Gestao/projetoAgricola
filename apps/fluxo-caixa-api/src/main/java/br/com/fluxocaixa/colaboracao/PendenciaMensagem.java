package br.com.fluxocaixa.colaboracao;

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
@Table(name = "pendencia_mensagens")
public class PendenciaMensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pendencia_id", nullable = false)
    private PendenciaAgro pendencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 1000)
    private String mensagem;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected PendenciaMensagem() {
    }

    public PendenciaMensagem(
            PendenciaAgro pendencia,
            Usuario usuario,
            String mensagem) {

        this.pendencia = pendencia;
        this.usuario = usuario;
        this.mensagem = mensagem;
    }

    public Long getId() { return id; }
    public PendenciaAgro getPendencia() { return pendencia; }
    public Usuario getUsuario() { return usuario; }
    public String getMensagem() { return mensagem; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
