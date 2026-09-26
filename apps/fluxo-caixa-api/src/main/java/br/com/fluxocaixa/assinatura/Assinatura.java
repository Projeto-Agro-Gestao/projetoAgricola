package br.com.fluxocaixa.assinatura;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assinaturas")
public class Assinatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssinaturaStatus status;

    @Column(name = "valor_mensal", nullable = false, precision = 19, scale = 2)
    private BigDecimal valorMensal;

    @Column(name = "trial_inicio")
    private LocalDate trialInicio;

    @Column(name = "trial_fim")
    private LocalDate trialFim;

    @Column(name = "proximo_vencimento")
    private LocalDate proximoVencimento;

    @Column(name = "ultimo_pagamento_em")
    private LocalDate ultimoPagamentoEm;

    @Column(name = "asaas_customer_id", length = 80)
    private String asaasCustomerId;

    @Version
    @Column(nullable = false)
    private Long versao;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Assinatura() {
    }

    public Assinatura(
            Empresa empresa,
            AssinaturaStatus status,
            BigDecimal valorMensal,
            LocalDate trialInicio,
            LocalDate trialFim) {

        this.empresa = empresa;
        this.status = status;
        this.valorMensal = valorMensal;
        this.trialInicio = trialInicio;
        this.trialFim = trialFim;
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public AssinaturaStatus getStatus() {
        return status;
    }

    public BigDecimal getValorMensal() {
        return valorMensal;
    }

    public LocalDate getTrialInicio() {
        return trialInicio;
    }

    public LocalDate getTrialFim() {
        return trialFim;
    }

    public LocalDate getProximoVencimento() {
        return proximoVencimento;
    }

    public LocalDate getUltimoPagamentoEm() {
        return ultimoPagamentoEm;
    }

    public String getAsaasCustomerId() {
        return asaasCustomerId;
    }

    public void atualizarStatusCalculado(
            AssinaturaStatus novoStatus) {

        if (status != AssinaturaStatus.ACTIVE
                && status != AssinaturaStatus.SUSPENDED
                && status != AssinaturaStatus.CANCELLED) {
            this.status = novoStatus;
        }
    }

    public void definirAsaasCustomerId(String asaasCustomerId) {
        this.asaasCustomerId = asaasCustomerId;
    }

    public void atualizarValor(BigDecimal valorMensal) {
        this.valorMensal = valorMensal;
    }

    public void definirTrial(LocalDate inicio, LocalDate fim) {
        this.trialInicio = inicio;
        this.trialFim = fim;
        this.status = AssinaturaStatus.TRIAL;
    }

    public void encerrarTrial(LocalDate hoje) {
        this.trialFim = hoje.minusDays(1);
        if (status == AssinaturaStatus.TRIAL
                || status == AssinaturaStatus.TRIAL_EXPIRING) {
            this.status = AssinaturaStatus.TRIAL_EXPIRED;
        }
    }

    public void ativar(LocalDate dataPagamento) {
        this.status = AssinaturaStatus.ACTIVE;
        this.ultimoPagamentoEm = dataPagamento;
        this.proximoVencimento = dataPagamento.plusMonths(1);
    }

    public void pendente() {
        if (status != AssinaturaStatus.ACTIVE) {
            this.status = AssinaturaStatus.PENDING;
        }
    }

    public void suspender() {
        this.status = AssinaturaStatus.SUSPENDED;
    }

    public void reativar() {
        this.status = AssinaturaStatus.ACTIVE;
    }

    public void definirStatusManual(AssinaturaStatus status) {
        this.status = status;
    }
}
