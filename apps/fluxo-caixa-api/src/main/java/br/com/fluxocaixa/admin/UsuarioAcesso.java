package br.com.fluxocaixa.admin;

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
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "usuario_acessos",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_usuario_acessos_usuario_data",
                columnNames = {"usuario_id", "data_uso"}
        )
)
public class UsuarioAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "data_uso", nullable = false)
    private LocalDate dataUso;

    @Column(nullable = false)
    private int quantidade;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected UsuarioAcesso() {
    }

    public UsuarioAcesso(
            Usuario usuario,
            LocalDate dataUso) {

        this.usuario = usuario;
        this.dataUso = dataUso;
        this.quantidade = 0;
    }

    public void registrarUso() {
        this.quantidade++;
    }

    public int getQuantidade() {
        return quantidade;
    }
}
