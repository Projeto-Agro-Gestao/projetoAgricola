package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParametroTributarioRepository
        extends JpaRepository<ParametroTributario, Long> {

    List<ParametroTributario>
    findAllByEmpresa_IdOrderByCompetenciaDescIdDesc(Long empresaId);

    Optional<ParametroTributario>
    findFirstByEmpresa_IdAndRegimeAndCompetenciaLessThanEqualOrderByCompetenciaDescIdDesc(
            Long empresaId,
            RegimeTributario regime,
            String competencia);
}
