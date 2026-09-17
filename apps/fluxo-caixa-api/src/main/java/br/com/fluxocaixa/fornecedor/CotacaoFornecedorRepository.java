package br.com.fluxocaixa.fornecedor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CotacaoFornecedorRepository
        extends JpaRepository<CotacaoFornecedor, Long> {

    List<CotacaoFornecedor>
    findAllByEmpresa_IdOrderByDataCotacaoDescIdDesc(Long empresaId);

    List<CotacaoFornecedor>
    findAllByEmpresa_IdAndFornecedor_IdOrderByDataCotacaoDescIdDesc(
            Long empresaId,
            Long fornecedorId);

    Optional<CotacaoFornecedor>
    findByIdAndEmpresa_Id(Long id, Long empresaId);
}
