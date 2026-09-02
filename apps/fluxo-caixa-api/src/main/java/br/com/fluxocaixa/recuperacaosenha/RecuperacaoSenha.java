package br.com.fluxocaixa.recuperacaosenha;

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
@Table(name = "recuperacao_senha")
public class RecuperacaoSenha {

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
            name = "expira_em",
            nullable = false
    )
    private LocalDateTime expiraEm;

    @Column(name = "utilizado_em")
    private LocalDateTime utilizadoEm;

    @Column(
            name = "criado_em",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime criadoEm;

    protected RecuperacaoSenha() {
    }

    public RecuperacaoSenha(
            Usuario usuario,
            String tokenHash,
            LocalDateTime expiraEm) {

        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
    }

    public boolean estaExpirado(
            LocalDateTime agora) {

        return !agora.isBefore(expiraEm);
    }

    public boolean foiUtilizado() {
        return utilizadoEm != null;
    }

    public boolean estaValido(
            LocalDateTime agora) {

        return !foiUtilizado()
                && !estaExpirado(agora);
    }

    public void marcarComoUtilizado(
            LocalDateTime agora) {

        this.utilizadoEm = agora;
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

    public LocalDateTime getExpiraEm() {
        return expiraEm;
    }

    public LocalDateTime getUtilizadoEm() {
        return utilizadoEm;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}