package br.com.fluxocaixa.assinatura;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssinaturaRepository
        extends JpaRepository<Assinatura, Long> {

    Optional<Assinatura> findByEmpresa_Id(Long empresaId);
}
