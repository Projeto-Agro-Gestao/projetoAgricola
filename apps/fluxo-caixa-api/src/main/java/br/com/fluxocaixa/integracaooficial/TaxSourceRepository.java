package br.com.fluxocaixa.integracaooficial;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxSourceRepository
        extends JpaRepository<TaxSource, Long> {
}
