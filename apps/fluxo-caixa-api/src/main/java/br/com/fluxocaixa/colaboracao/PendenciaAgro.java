package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.Movimentacao;
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
@Table(name = "pendencias_agro")
public class PendenciaAgro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimentacao_id")
    private Movimentacao movimentacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_id")
    private DocumentoAgro documento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criada_por_usuario_id")
    private Usuario criadaPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_usuario_id")
    private Usuario responsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoPendenciaAgro tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusPendenciaAgro status =
            StatusPendenciaAgro.ABERTA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrioridadePendenciaAgro prioridade =
            PrioridadePendenciaAgro.NORMAL;

    @Column(nullable = false, length = 160)
    private String titulo;

    @Column(length = 1000)
    private String descricao;

    private LocalDate vencimento;

    @Column(name = "resolvida_em")
    private LocalDateTime resolvidaEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected PendenciaAgro() {
    }

    public PendenciaAgro(
            Empresa empresa,
            Movimentacao movimentacao,
            DocumentoAgro documento,
            Usuario criadaPor,
            Usuario responsavel,
            TipoPendenciaAgro tipo,
            PrioridadePendenciaAgro prioridade,
            String titulo,
            String descricao,
            LocalDate vencimento) {

        this.empresa = empresa;
        this.movimentacao = movimentacao;
        this.documento = documento;
        this.criadaPor = criadaPor;
        this.responsavel = responsavel;
        this.tipo = tipo;
        this.prioridade = prioridade == null
                ? PrioridadePendenciaAgro.NORMAL
                : prioridade;
        this.titulo = titulo;
        this.descricao = descricao;
        this.vencimento = vencimento;
        this.status = tipo == TipoPendenciaAgro.DOCUMENTO_SOLICITADO
                ? StatusPendenciaAgro.AGUARDANDO_PRODUTOR
                : StatusPendenciaAgro.ABERTA;
    }

    public void responderPeloProdutor(DocumentoAgro documento) {
        this.documento = documento;
        this.status = StatusPendenciaAgro.AGUARDANDO_CONTADOR;
    }

    public void colocarEmAnalise() {
        this.status = StatusPendenciaAgro.EM_ANALISE;
    }

    public void resolver() {
        this.status = StatusPendenciaAgro.RESOLVIDA;
        this.resolvidaEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public Movimentacao getMovimentacao() { return movimentacao; }
    public DocumentoAgro getDocumento() { return documento; }
    public Usuario getCriadaPor() { return criadaPor; }
    public Usuario getResponsavel() { return responsavel; }
    public TipoPendenciaAgro getTipo() { return tipo; }
    public StatusPendenciaAgro getStatus() { return status; }
    public PrioridadePendenciaAgro getPrioridade() { return prioridade; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public LocalDate getVencimento() { return vencimento; }
    public LocalDateTime getResolvidaEm() { return resolvidaEm; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
