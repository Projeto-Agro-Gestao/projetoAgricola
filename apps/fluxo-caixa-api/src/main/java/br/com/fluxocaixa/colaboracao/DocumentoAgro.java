package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.usuario.Usuario;
import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "documentos_agro")
public class DocumentoAgro {

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
    @JoinColumn(name = "enviado_por_usuario_id")
    private Usuario enviadoPor;

    @Column(name = "nome_arquivo", nullable = false, length = 180)
    private String nomeArquivo;

    @Column(name = "tipo_conteudo", length = 120)
    private String tipoConteudo;

    @Column(name = "tamanho_bytes", nullable = false)
    private long tamanhoBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", nullable = false, length = 40)
    private TipoDocumentoAgro tipoDocumento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusDocumentoAgro status =
            StatusDocumentoAgro.ENVIADO;

    @Column(length = 500)
    private String observacao;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column
    private byte[] conteudo;

    @Column(name = "analisado_em")
    private LocalDateTime analisadoEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected DocumentoAgro() {
    }

    public DocumentoAgro(
            Empresa empresa,
            Movimentacao movimentacao,
            Usuario enviadoPor,
            String nomeArquivo,
            String tipoConteudo,
            long tamanhoBytes,
            TipoDocumentoAgro tipoDocumento,
            String observacao,
            byte[] conteudo) {

        this.empresa = empresa;
        this.movimentacao = movimentacao;
        this.enviadoPor = enviadoPor;
        this.nomeArquivo = nomeArquivo;
        this.tipoConteudo = tipoConteudo;
        this.tamanhoBytes = tamanhoBytes;
        this.tipoDocumento = tipoDocumento;
        this.observacao = observacao;
        this.conteudo = conteudo;
        this.status = movimentacao == null
                ? StatusDocumentoAgro.ENVIADO
                : StatusDocumentoAgro.VINCULADO;
    }

    public void marcarEmAnalise() {
        this.status = StatusDocumentoAgro.AGUARDANDO_ANALISE;
    }

    public void marcarAnalisado() {
        this.status = StatusDocumentoAgro.ANALISADO;
        this.analisadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Empresa getEmpresa() { return empresa; }
    public Movimentacao getMovimentacao() { return movimentacao; }
    public Usuario getEnviadoPor() { return enviadoPor; }
    public String getNomeArquivo() { return nomeArquivo; }
    public String getTipoConteudo() { return tipoConteudo; }
    public long getTamanhoBytes() { return tamanhoBytes; }
    public TipoDocumentoAgro getTipoDocumento() { return tipoDocumento; }
    public StatusDocumentoAgro getStatus() { return status; }
    public String getObservacao() { return observacao; }
    public byte[] getConteudo() { return conteudo; }
    public LocalDateTime getAnalisadoEm() { return analisadoEm; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
