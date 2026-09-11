package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
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
@Table(name = "categorias")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "empresa_id",
            nullable = false
    )
    private Empresa empresa;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AreaCategoria area = AreaCategoria.GERAL;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "arquivada_em")
    private LocalDateTime arquivadaEm;

    @CreationTimestamp
    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(
            name = "atualizado_em",
            nullable = false
    )
    private LocalDateTime atualizadoEm;

    protected Categoria() {
    }

    public Categoria(
            Empresa empresa,
            String nome,
            TipoMovimentacao tipo) {

        this(empresa, nome, tipo, AreaCategoria.GERAL);
    }

    public Categoria(
            Empresa empresa,
            String nome,
            TipoMovimentacao tipo,
            AreaCategoria area) {

        this.empresa = empresa;
        this.nome = nome;
        this.tipo = tipo;
        this.area = area != null
                ? area
                : AreaCategoria.GERAL;
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

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public AreaCategoria getArea() {
        return area;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public LocalDateTime getArquivadaEm() {
        return arquivadaEm;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void alterarNome(String nome) {
        this.nome = nome;
    }

    public void alterarArea(AreaCategoria area) {
        this.area = area != null
                ? area
                : AreaCategoria.GERAL;
    }

    public void desativar() {
        this.ativo = false;

        if (this.arquivadaEm == null) {
            this.arquivadaEm =
                    LocalDateTime.now();
        }
    }

    public void ativar() {
        this.ativo = true;
        this.arquivadaEm = null;
    }
}
