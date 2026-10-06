package br.com.fluxocaixa.refreshtoken;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "usuario_id",
            nullable = false
    )
    private Usuario usuario;

    @Column(
            name = "token_hash",
            nullable = false,
            unique = true,
            length = 64
    )
    private String tokenHash;

    @Column(
            name = "data_criacao",
            nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6)"
    )
    private LocalDateTime dataCriacao;

    @Column(
            name = "data_expiracao",
            nullable = false
    )
    private LocalDateTime dataExpiracao;

    @Column(name = "revogado_em")
    private LocalDateTime revogadoEm;

    @Column(name = "substituido_por_id")
    private Long substituidoPorId;

    protected RefreshToken() {
    }

    public RefreshToken(
            Usuario usuario,
            String tokenHash,
            LocalDateTime dataExpiracao) {

        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.dataExpiracao = dataExpiracao;
    }

    public boolean estaExpirado(
            LocalDateTime agora) {

        return !agora.isBefore(dataExpiracao);
    }

    public boolean estaRevogado() {
        return revogadoEm != null;
    }

    public boolean foiRotacionado() {
        return substituidoPorId != null;
    }

    public boolean estaValido(
            LocalDateTime agora) {

        return !estaRevogado()
                && !foiRotacionado()
                && !estaExpirado(agora);
    }

    public void revogar(
            LocalDateTime agora) {

        if (revogadoEm == null) {
            this.revogadoEm = agora;
        }
    }

    public void substituirPor(
            Long novoId,
            LocalDateTime agora) {

        this.substituidoPorId = novoId;
        revogar(agora);
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public LocalDateTime getDataExpiracao() {
        return dataExpiracao;
    }

    public LocalDateTime getRevogadoEm() {
        return revogadoEm;
    }

    public Long getSubstituidoPorId() {
        return substituidoPorId;
    }
}
