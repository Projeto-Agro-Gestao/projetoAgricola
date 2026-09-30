package br.com.fluxocaixa.fornecedor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    boolean existsByEmpresa_IdAndDocumentoAndExcluidoFalse(
            Long empresaId,
            String documento
    );

    boolean existsByEmpresa_IdAndDocumentoAndIdNotAndExcluidoFalse(
            Long empresaId,
            String documento,
            Long fornecedorId
    );

    @Query(
            """
            select coalesce(max(f.codigoCadastro), 0)
            from Fornecedor f
            where f.empresa.id = :empresaId
            """
    )
    Long buscarMaiorCodigoCadastroPorEmpresa(Long empresaId);
}
