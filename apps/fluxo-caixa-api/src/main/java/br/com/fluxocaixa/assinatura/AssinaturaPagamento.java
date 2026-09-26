package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.Movimentacao;
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
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assinatura_pagamentos")
public class AssinaturaPagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assinatura_id", nullable = false)
    private Assinatura assinatura;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimentacao_id")
    private Movimentacao movimentacao;

    @Column(name = "asaas_payment_id", nullable = false, length = 80)
    private String asaasPaymentId;

    @Column(name = "external_reference", nullable = false, length = 120)
    private String externalReference;

    @Column(nullable = false, length = 180)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", nullable = false, length = 20)
    private FormaPagamentoAssinatura formaPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusPagamentoAssinatura status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate vencimento;

    @Column(name = "pago_em")
    private LocalDate pagoEm;

    @Column(name = "invoice_url", length = 500)
    private String invoiceUrl;

    @Column(name = "boleto_url", length = 500)
    private String boletoUrl;

    @Column(name = "linha_digitavel", length = 120)
    private String linhaDigitavel;

    @Column(name = "pix_qr_code_base64", columnDefinition = "LONGTEXT")
    private String pixQrCodeBase64;

    @Column(name = "pix_copia_cola", columnDefinition = "LONGTEXT")
    private String pixCopiaCola;

    @Column(name = "pix_expira_em")
    private LocalDateTime pixExpiraEm;

    @Version
    @Column(nullable = false)
    private Long versao;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected AssinaturaPagamento() {
    }

    public AssinaturaPagamento(
            Assinatura assinatura,
            String asaasPaymentId,
            String externalReference,
            String descricao,
            FormaPagamentoAssinatura formaPagamento,
            BigDecimal valor,
            LocalDate vencimento,
            String invoiceUrl,
            String boletoUrl) {

        this.assinatura = assinatura;
        this.empresa = assinatura.getEmpresa();
        this.asaasPaymentId = asaasPaymentId;
        this.externalReference = externalReference;
        this.descricao = descricao;
        this.formaPagamento = formaPagamento;
        this.status = StatusPagamentoAssinatura.PENDING;
        this.valor = valor;
        this.vencimento = vencimento;
        this.invoiceUrl = invoiceUrl;
        this.boletoUrl = boletoUrl;
    }

    public Long getId() {
        return id;
    }

    public Assinatura getAssinatura() {
        return assinatura;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public Movimentacao getMovimentacao() {
        return movimentacao;
    }

    public String getAsaasPaymentId() {
        return asaasPaymentId;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public String getDescricao() {
        return descricao;
    }

    public FormaPagamentoAssinatura getFormaPagamento() {
        return formaPagamento;
    }

    public StatusPagamentoAssinatura getStatus() {
        return status;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public LocalDate getVencimento() {
        return vencimento;
    }

    public LocalDate getPagoEm() {
        return pagoEm;
    }

    public String getInvoiceUrl() {
        return invoiceUrl;
    }

    public String getBoletoUrl() {
        return boletoUrl;
    }

    public String getLinhaDigitavel() {
        return linhaDigitavel;
    }

    public String getPixQrCodeBase64() {
        return pixQrCodeBase64;
    }

    public String getPixCopiaCola() {
        return pixCopiaCola;
    }

    public LocalDateTime getPixExpiraEm() {
        return pixExpiraEm;
    }

    public void registrarLinhaDigitavel(String linhaDigitavel) {
        this.linhaDigitavel = linhaDigitavel;
    }

    public void registrarPix(
            String pixQrCodeBase64,
            String pixCopiaCola,
            LocalDateTime pixExpiraEm) {

        this.pixQrCodeBase64 = pixQrCodeBase64;
        this.pixCopiaCola = pixCopiaCola;
        this.pixExpiraEm = pixExpiraEm;
    }

    public void confirmar(LocalDate dataPagamento) {
        if (status != StatusPagamentoAssinatura.RECEIVED) {
            this.status = StatusPagamentoAssinatura.CONFIRMED;
        }
        this.pagoEm = dataPagamento;
    }

    public void recebido(LocalDate dataPagamento) {
        this.status = StatusPagamentoAssinatura.RECEIVED;
        this.pagoEm = dataPagamento;
    }

    public void vencido() {
        this.status = StatusPagamentoAssinatura.OVERDUE;
    }

    public void cancelado() {
        this.status = StatusPagamentoAssinatura.CANCELLED;
    }

    public void vincularMovimentacao(Movimentacao movimentacao) {
        this.movimentacao = movimentacao;
    }
}
