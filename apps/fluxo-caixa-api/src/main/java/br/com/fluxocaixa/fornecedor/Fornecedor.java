package br.com.fluxocaixa.fornecedor;

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
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "fornecedores")
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 30)
    private String telefone;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private boolean excluido = false;

    @Column(name = "excluido_em")
    private LocalDateTime excluidoEm;

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Fornecedor() {
    }

    public Fornecedor(
            Empresa empresa,
            String nome,
            String telefone,
            String observacao) {

        this.empresa = empresa;
        this.nome = nome;
        this.telefone = telefone;
        this.observacao = observacao;
    }

    public void atualizar(
            String nome,
            String telefone,
            String observacao) {

        this.nome = nome;
        this.telefone = telefone;
        this.observacao = observacao;
    }

    public void moverParaLixeira() {
        this.excluido = true;
        this.excluidoEm = LocalDateTime.now();
    }

    public void restaurar() {
        this.excluido = false;
        this.excluidoEm = null;
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public String getNome() {
        return nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getObservacao() {
        return observacao;
    }

    public boolean isExcluido() {
        return excluido;
    }

    public LocalDateTime getExcluidoEm() {
        return excluidoEm;
    }

    public Long getVersao() {
        return versao;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
