package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AtividadeRuralRepository
        extends JpaRepository<AtividadeRural, Long> {

    List<AtividadeRural>
    findAllByEmpresa_IdAndAtivaTrueOrderByNomeAsc(Long empresaId);

    Optional<AtividadeRural>
    findByIdAndEmpresa_Id(Long id, Long empresaId);
}
