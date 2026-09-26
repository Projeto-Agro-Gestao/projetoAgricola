package br.com.fluxocaixa.assinatura;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "asaas_webhook_eventos")
public class AsaasWebhookEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chave_evento", nullable = false, length = 160)
    private String chaveEvento;

    @Column(nullable = false, length = 80)
    private String evento;

    @Column(name = "asaas_payment_id", length = 80)
    private String asaasPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_processamento", nullable = false, length = 30)
    private StatusProcessamentoWebhook statusProcessamento;

    @Column(columnDefinition = "LONGTEXT")
    private String payload;

    @Column(length = 500)
    private String erro;

    @CreationTimestamp
    @Column(name = "recebido_em", nullable = false, updatable = false)
    private LocalDateTime recebidoEm;

    @Column(name = "processado_em")
    private LocalDateTime processadoEm;

    protected AsaasWebhookEvento() {
    }

    public AsaasWebhookEvento(
            String chaveEvento,
            String evento,
            String asaasPaymentId,
            String payload) {

        this.chaveEvento = chaveEvento;
        this.evento = evento;
        this.asaasPaymentId = asaasPaymentId;
        this.payload = payload;
        this.statusProcessamento = StatusProcessamentoWebhook.RECEIVED;
    }

    public void processado() {
        this.statusProcessamento = StatusProcessamentoWebhook.PROCESSED;
        this.processadoEm = LocalDateTime.now();
    }

    public void ignorado() {
        this.statusProcessamento = StatusProcessamentoWebhook.IGNORED;
        this.processadoEm = LocalDateTime.now();
    }

    public void erro(String mensagem) {
        this.statusProcessamento = StatusProcessamentoWebhook.ERROR;
        this.erro = mensagem;
        this.processadoEm = LocalDateTime.now();
    }
}
