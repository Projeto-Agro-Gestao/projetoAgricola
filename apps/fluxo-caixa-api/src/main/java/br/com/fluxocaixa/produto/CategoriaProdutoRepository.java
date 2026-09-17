package br.com.fluxocaixa.produto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaProdutoRepository
        extends JpaRepository<CategoriaProduto, Long> {

    List<CategoriaProduto>
    findAllByEmpresa_IdAndAtivoTrueOrderByNomeAsc(Long empresaId);

    Optional<CategoriaProduto>
    findByIdAndEmpresa_Id(Long id, Long empresaId);

    Optional<CategoriaProduto>
    findByEmpresa_IdAndNomeIgnoreCase(Long empresaId, String nome);
}
