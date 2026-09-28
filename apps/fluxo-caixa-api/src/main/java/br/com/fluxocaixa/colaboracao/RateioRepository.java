package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RateioRepository
        extends JpaRepository<Rateio, Long> {

    List<Rateio> findAllByEmpresa_IdOrderByCriadoEmDesc(Long empresaId);

    Optional<Rateio> findByMovimentacao_IdAndEmpresa_Id(
            Long movimentacaoId,
            Long empresaId
    );
}
