package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContadorEmpresaRepository
        extends JpaRepository<ContadorEmpresa, Long> {

    boolean existsByContador_IdAndEmpresa_IdAndStatus(
            Long contadorId,
            Long empresaId,
            StatusVinculoContador status
    );

    List<ContadorEmpresa>
    findAllByContador_IdAndStatusOrderByEmpresa_NomeAsc(
            Long contadorId,
            StatusVinculoContador status
    );
}
