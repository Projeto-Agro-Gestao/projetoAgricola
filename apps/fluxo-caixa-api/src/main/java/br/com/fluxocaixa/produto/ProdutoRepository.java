package br.com.fluxocaixa.produto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findAllByEmpresa_IdAndAtivoTrueOrderByNomeAsc(
            Long empresaId);

    List<Produto>
    findAllByEmpresa_IdAndCategoria_IdAndAtivoTrueOrderByNomeAsc(
            Long empresaId,
            Long categoriaId);

    Optional<Produto> findByIdAndEmpresa_Id(Long id, Long empresaId);

    Optional<Produto>
    findByEmpresa_IdAndCategoria_IdAndNomeIgnoreCase(
            Long empresaId,
            Long categoriaId,
            String nome);
}
