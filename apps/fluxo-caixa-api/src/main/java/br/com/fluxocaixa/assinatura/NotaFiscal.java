package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.comum.FusoHorario;

import br.com.fluxocaixa.empresa.Empresa;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "notas_fiscais_asaas")
public class NotaFiscal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assinatura_pagamento_id", nullable = false)
    private AssinaturaPagamento pagamento;

    @Column(name = "asaas_payment_id", nullable = false, length = 80)
    private String asaasPaymentId;

    @Column(name = "asaas_invoice_id", length = 80)
    private String asaasInvoiceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotaFiscalStatus status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_emissao_prevista")
    private LocalDate dataEmissaoPrevista;

    @Column(name = "data_autorizacao")
    private LocalDate dataAutorizacao;

    @Column(name = "numero_nota", length = 80)
    private String numeroNota;

    @Column(name = "codigo_validacao", length = 120)
    private String codigoValidacao;

    @Column(name = "pdf_url", length = 700)
    private String pdfUrl;

    @Column(name = "xml_url", length = 700)
    private String xmlUrl;

    @Column(name = "descricao_servico", nullable = false, length = 500)
    private String descricaoServico;

    @Column(name = "codigo_servico_municipal", length = 80)
    private String codigoServicoMunicipal;

    @Column(name = "mensagem_erro", length = 700)
    private String mensagemErro;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected NotaFiscal() {
    }

    public NotaFiscal(
            Empresa empresa,
            AssinaturaPagamento pagamento,
            String asaasInvoiceId,
            NotaFiscalStatus status,
            BigDecimal valor,
            LocalDate dataEmissaoPrevista,
            String descricaoServico,
            String codigoServicoMunicipal) {

        this.empresa = empresa;
        this.pagamento = pagamento;
        this.asaasPaymentId = pagamento.getAsaasPaymentId();
        this.asaasInvoiceId = asaasInvoiceId;
        this.status = status;
        this.valor = valor;
        this.dataEmissaoPrevista = dataEmissaoPrevista;
        this.descricaoServico = descricaoServico;
        this.codigoServicoMunicipal = codigoServicoMunicipal;
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public AssinaturaPagamento getPagamento() {
        return pagamento;
    }

    public String getAsaasPaymentId() {
        return asaasPaymentId;
    }

    public String getAsaasInvoiceId() {
        return asaasInvoiceId;
    }

    public NotaFiscalStatus getStatus() {
        return status;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public LocalDate getDataEmissaoPrevista() {
        return dataEmissaoPrevista;
    }

    public LocalDate getDataAutorizacao() {
        return dataAutorizacao;
    }

    public String getNumeroNota() {
        return numeroNota;
    }

    public String getCodigoValidacao() {
        return codigoValidacao;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public String getXmlUrl() {
        return xmlUrl;
    }

    public String getDescricaoServico() {
        return descricaoServico;
    }

    public String getCodigoServicoMunicipal() {
        return codigoServicoMunicipal;
    }

    public String getMensagemErro() {
        return mensagemErro;
    }

    public void atualizarDeAsaas(
            String asaasInvoiceId,
            NotaFiscalStatus status,
            String numeroNota,
            String codigoValidacao,
            String pdfUrl,
            String xmlUrl,
            LocalDate dataAutorizacao,
            String mensagemErro) {

        if (asaasInvoiceId != null && !asaasInvoiceId.isBlank()) {
            this.asaasInvoiceId = asaasInvoiceId;
        }
        this.status = status;
        this.numeroNota = primeiroTexto(numeroNota, this.numeroNota);
        this.codigoValidacao =
                primeiroTexto(codigoValidacao, this.codigoValidacao);
        this.pdfUrl = primeiroTexto(pdfUrl, this.pdfUrl);
        this.xmlUrl = primeiroTexto(xmlUrl, this.xmlUrl);
        this.mensagemErro = mensagemErro;

        if (status == NotaFiscalStatus.AUTHORIZED) {
            this.dataAutorizacao = dataAutorizacao == null
                    ? FusoHorario.hoje()
                    : dataAutorizacao;
        }
    }

    private String primeiroTexto(String novoValor, String valorAtual) {
        return novoValor == null || novoValor.isBlank()
                ? valorAtual
                : novoValor;
    }
}
