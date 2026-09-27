package br.com.fluxocaixa.assinatura;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "assinatura_configuracoes")
public class AssinaturaConfiguracao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "preco_mensal", nullable = false, precision = 19, scale = 2)
    private BigDecimal precoMensal;

    @Column(name = "trial_habilitado", nullable = false)
    private boolean trialHabilitado;

    @Column(name = "dias_trial_padrao", nullable = false)
    private int diasTrialPadrao;

    @Column(name = "dias_aviso_trial", nullable = false)
    private int diasAvisoTrial;

    @Column(name = "dias_carencia", nullable = false)
    private int diasCarencia;

    @Column(name = "intervalo_alerta_minutos", nullable = false)
    private int intervaloAlertaMinutos = 3;

    @Column(name = "pix_habilitado", nullable = false)
    private boolean pixHabilitado = true;

    @Column(name = "boleto_habilitado", nullable = false)
    private boolean boletoHabilitado = true;

    @Column(name = "dias_aviso_vencimento", nullable = false)
    private int diasAvisoVencimento = 3;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected AssinaturaConfiguracao() {
    }

    public BigDecimal getPrecoMensal() {
        return precoMensal;
    }

    public boolean isTrialHabilitado() {
        return trialHabilitado;
    }

    public int getDiasTrialPadrao() {
        return diasTrialPadrao;
    }

    public int getDiasAvisoTrial() {
        return diasAvisoTrial;
    }

    public int getDiasCarencia() {
        return diasCarencia;
    }

    public int getIntervaloAlertaMinutos() {
        return intervaloAlertaMinutos;
    }

    public boolean isPixHabilitado() {
        return pixHabilitado;
    }

    public boolean isBoletoHabilitado() {
        return boletoHabilitado;
    }

    public int getDiasAvisoVencimento() {
        return diasAvisoVencimento;
    }

    public void atualizar(
            BigDecimal precoMensal,
            boolean trialHabilitado,
            int diasTrialPadrao,
            int diasAvisoTrial,
            int diasCarencia) {

        atualizar(
                precoMensal,
                trialHabilitado,
                diasTrialPadrao,
                diasAvisoTrial,
                diasCarencia,
                intervaloAlertaMinutos,
                pixHabilitado,
                boletoHabilitado,
                diasAvisoVencimento
        );
    }

    public void atualizar(
            BigDecimal precoMensal,
            boolean trialHabilitado,
            int diasTrialPadrao,
            int diasAvisoTrial,
            int diasCarencia,
            int intervaloAlertaMinutos,
            boolean pixHabilitado,
            boolean boletoHabilitado,
            int diasAvisoVencimento) {

        this.precoMensal = precoMensal;
        this.trialHabilitado = trialHabilitado;
        this.diasTrialPadrao = diasTrialPadrao;
        this.diasAvisoTrial = diasAvisoTrial;
        this.diasCarencia = diasCarencia;
        this.intervaloAlertaMinutos = intervaloAlertaMinutos;
        this.pixHabilitado = pixHabilitado;
        this.boletoHabilitado = boletoHabilitado;
        this.diasAvisoVencimento = diasAvisoVencimento;
    }
}
