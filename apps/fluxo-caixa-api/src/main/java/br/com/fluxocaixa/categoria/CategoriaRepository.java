package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository
        extends JpaRepository<Categoria, Long> {

    boolean existsByEmpresa_IdAndNomeIgnoreCaseAndTipo(
            Long empresaId,
            String nome,
            TipoMovimentacao tipo
    );

    List<Categoria> findAllByEmpresa_IdAndAtivoTrueOrderByNomeAsc(
            Long empresaId
    );

    List<Categoria> findAllByEmpresa_IdAndTipoAndAtivoTrueOrderByNomeAsc(
            Long empresaId,
            TipoMovimentacao tipo
    );

    List<Categoria> findAllByEmpresa_IdOrderByAtivoDescNomeAsc(
            Long empresaId
    );

    Optional<Categoria> findByIdAndEmpresa_Id(
            Long categoriaId,
            Long empresaId
    );
}