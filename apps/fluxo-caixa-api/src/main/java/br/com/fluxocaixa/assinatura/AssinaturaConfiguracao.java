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

    @Column(name = "nfse_habilitada", nullable = false)
    private boolean nfseHabilitada;

    @Column(name = "nfse_emissao_automatica", nullable = false)
    private boolean nfseEmissaoAutomatica;

    @Column(name = "nfse_municipal_service_id", length = 80)
    private String nfseMunicipalServiceId;

    @Column(name = "nfse_municipal_service_code", length = 40)
    private String nfseMunicipalServiceCode;

    @Column(name = "nfse_municipal_service_name", length = 180)
    private String nfseMunicipalServiceName;

    @Column(name = "nfse_service_description_template", nullable = false, length = 500)
    private String nfseServiceDescriptionTemplate =
            "Licenca de uso do software AgroGestao referente a competencia {MM/AAAA}.";

    @Column(name = "nfse_default_observations", nullable = false, length = 500)
    private String nfseDefaultObservations =
            "Mensalidade do AgroGestao.";

    @Column(name = "nfse_iss", nullable = false, precision = 5, scale = 2)
    private BigDecimal nfseIss = BigDecimal.ZERO;

    @Column(name = "nfse_cofins", nullable = false, precision = 5, scale = 2)
    private BigDecimal nfseCofins = BigDecimal.ZERO;

    @Column(name = "nfse_csll", nullable = false, precision = 5, scale = 2)
    private BigDecimal nfseCsll = BigDecimal.ZERO;

    @Column(name = "nfse_inss", nullable = false, precision = 5, scale = 2)
    private BigDecimal nfseInss = BigDecimal.ZERO;

    @Column(name = "nfse_ir", nullable = false, precision = 5, scale = 2)
    private BigDecimal nfseIr = BigDecimal.ZERO;

    @Column(name = "nfse_pis", nullable = false, precision = 5, scale = 2)
    private BigDecimal nfsePis = BigDecimal.ZERO;

    @Column(name = "nfse_retain_iss", nullable = false)
    private boolean nfseRetainIss;

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

    public boolean isNfseHabilitada() {
        return nfseHabilitada;
    }

    public boolean isNfseEmissaoAutomatica() {
        return nfseEmissaoAutomatica;
    }

    public String getNfseMunicipalServiceId() {
        return nfseMunicipalServiceId;
    }

    public String getNfseMunicipalServiceCode() {
        return nfseMunicipalServiceCode;
    }

    public String getNfseMunicipalServiceName() {
        return nfseMunicipalServiceName;
    }

    public String getNfseServiceDescriptionTemplate() {
        return nfseServiceDescriptionTemplate;
    }

    public String getNfseDefaultObservations() {
        return nfseDefaultObservations;
    }

    public BigDecimal getNfseIss() {
        return nfseIss;
    }

    public BigDecimal getNfseCofins() {
        return nfseCofins;
    }

    public BigDecimal getNfseCsll() {
        return nfseCsll;
    }

    public BigDecimal getNfseInss() {
        return nfseInss;
    }

    public BigDecimal getNfseIr() {
        return nfseIr;
    }

    public BigDecimal getNfsePis() {
        return nfsePis;
    }

    public boolean isNfseRetainIss() {
        return nfseRetainIss;
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

    public void atualizarNfse(
            boolean nfseHabilitada,
            boolean nfseEmissaoAutomatica,
            String nfseMunicipalServiceId,
            String nfseMunicipalServiceCode,
            String nfseMunicipalServiceName,
            String nfseServiceDescriptionTemplate,
            String nfseDefaultObservations,
            BigDecimal nfseIss,
            BigDecimal nfseCofins,
            BigDecimal nfseCsll,
            BigDecimal nfseInss,
            BigDecimal nfseIr,
            BigDecimal nfsePis,
            boolean nfseRetainIss) {

        this.nfseHabilitada = nfseHabilitada;
        this.nfseEmissaoAutomatica = nfseEmissaoAutomatica;
        this.nfseMunicipalServiceId = limpar(nfseMunicipalServiceId);
        this.nfseMunicipalServiceCode = limpar(nfseMunicipalServiceCode);
        this.nfseMunicipalServiceName = limpar(nfseMunicipalServiceName);
        this.nfseServiceDescriptionTemplate =
                textoPadrao(
                        nfseServiceDescriptionTemplate,
                        this.nfseServiceDescriptionTemplate
                );
        this.nfseDefaultObservations =
                textoPadrao(
                        nfseDefaultObservations,
                        this.nfseDefaultObservations
                );
        this.nfseIss = valorOuZero(nfseIss);
        this.nfseCofins = valorOuZero(nfseCofins);
        this.nfseCsll = valorOuZero(nfseCsll);
        this.nfseInss = valorOuZero(nfseInss);
        this.nfseIr = valorOuZero(nfseIr);
        this.nfsePis = valorOuZero(nfsePis);
        this.nfseRetainIss = nfseRetainIss;
    }

    private String limpar(String valor) {
        return valor == null || valor.isBlank()
                ? null
                : valor.trim();
    }

    private String textoPadrao(String valor, String padrao) {
        return valor == null || valor.isBlank()
                ? padrao
                : valor.trim();
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
