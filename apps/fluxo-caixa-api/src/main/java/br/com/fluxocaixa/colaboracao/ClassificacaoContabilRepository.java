package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassificacaoContabilRepository
        extends JpaRepository<ClassificacaoContabil, Long> {

    List<ClassificacaoContabil>
    findAllByEmpresa_IdAndAtivaTrueOrderByNomeAsc(Long empresaId);

    Optional<ClassificacaoContabil>
    findByIdAndEmpresa_Id(Long id, Long empresaId);
}
