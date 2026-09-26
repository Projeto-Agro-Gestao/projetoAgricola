package br.com.fluxocaixa.assinatura;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AsaasWebhookEventoRepository
        extends JpaRepository<AsaasWebhookEvento, Long> {

    boolean existsByChaveEvento(String chaveEvento);
}
