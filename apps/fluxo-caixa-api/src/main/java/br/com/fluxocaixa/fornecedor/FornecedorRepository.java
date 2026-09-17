package br.com.fluxocaixa.fornecedor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FornecedorRepository
        extends JpaRepository<Fornecedor, Long> {

    List<Fornecedor>
    findAllByEmpresa_IdAndExcluidoFalseOrderByNomeAsc(
            Long empresaId
    );

    List<Fornecedor>
    findAllByEmpresa_IdAndExcluidoTrueOrderByExcluidoEmDescIdDesc(
            Long empresaId
    );

    Optional<Fornecedor> findByIdAndEmpresa_IdAndExcluidoFalse(
            Long fornecedorId,
            Long empresaId
    );

    Optional<Fornecedor> findByIdAndEmpresa_IdAndExcluidoTrue(
            Long fornecedorId,
            Long empresaId
    );

    boolean existsByEmpresa_IdAndNomeIgnoreCaseAndExcluidoFalse(
            Long empresaId,
            String nome
    );
}
