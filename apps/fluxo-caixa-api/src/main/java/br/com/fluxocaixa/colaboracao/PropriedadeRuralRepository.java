package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropriedadeRuralRepository
        extends JpaRepository<PropriedadeRural, Long> {

    List<PropriedadeRural>
    findAllByEmpresa_IdAndAtivaTrueOrderByNomeAsc(Long empresaId);

    Optional<PropriedadeRural>
    findByIdAndEmpresa_Id(Long id, Long empresaId);
}
