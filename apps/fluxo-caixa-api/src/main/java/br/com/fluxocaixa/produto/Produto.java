package br.com.fluxocaixa.produto;

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
@Table(name = "produtos")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_produto_id", nullable = false)
    private CategoriaProduto categoria;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "unidade_base", nullable = false, length = 30)
    private String unidadeBase;

    @Column(name = "peso_padrao_kg", precision = 19, scale = 3)
    private BigDecimal pesoPadraoKg;

    @Column(nullable = false)
    private boolean ativo = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Produto() {
    }

    public Produto(
            Empresa empresa,
            CategoriaProduto categoria,
            String nome,
            String unidadeBase,
            BigDecimal pesoPadraoKg) {

        this.empresa = empresa;
        this.categoria = categoria;
        this.nome = nome;
        this.unidadeBase = unidadeBase;
        this.pesoPadraoKg = pesoPadraoKg;
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public CategoriaProduto getCategoria() {
        return categoria;
    }

    public String getNome() {
        return nome;
    }

    public String getUnidadeBase() {
        return unidadeBase;
    }

    public BigDecimal getPesoPadraoKg() {
        return pesoPadraoKg;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void atualizar(
            CategoriaProduto categoria,
            String nome,
            String unidadeBase,
            BigDecimal pesoPadraoKg) {

        this.categoria = categoria;
        this.nome = nome;
        this.unidadeBase = unidadeBase;
        this.pesoPadraoKg = pesoPadraoKg;
    }

    public void desativar() {
        this.ativo = false;
    }

    public void ativar() {
        this.ativo = true;
    }
}
