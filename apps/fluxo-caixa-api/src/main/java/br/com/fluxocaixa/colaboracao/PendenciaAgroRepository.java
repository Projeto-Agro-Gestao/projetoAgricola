package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PendenciaAgroRepository
        extends JpaRepository<PendenciaAgro, Long> {

    List<PendenciaAgro>
    findAllByEmpresa_IdOrderByCriadoEmDesc(Long empresaId);

    List<PendenciaAgro>
    findAllByEmpresa_IdAndStatusOrderByCriadoEmDesc(
            Long empresaId,
            StatusPendenciaAgro status
    );

    Optional<PendenciaAgro>
    findByIdAndEmpresa_Id(Long pendenciaId, Long empresaId);

    long countByEmpresa_IdAndStatusNot(
            Long empresaId,
            StatusPendenciaAgro status
    );

    long countByEmpresa_IdAndTipoAndStatusNot(
            Long empresaId,
            TipoPendenciaAgro tipo,
            StatusPendenciaAgro status
    );
}
