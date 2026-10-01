package br.com.fluxocaixa.integracaooficial;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OfficialCnpjCacheRepository
        extends JpaRepository<OfficialCnpjCache, Long> {

    Optional<OfficialCnpjCache>
    findFirstByCnpjAndProviderOrderByConsultadoEmDesc(
            String cnpj,
            OfficialCnpjProviderType provider
    );
}
