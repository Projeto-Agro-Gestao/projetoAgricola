package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentoAgroRepository
        extends JpaRepository<DocumentoAgro, Long> {

    List<DocumentoAgro>
    findAllByEmpresa_IdOrderByCriadoEmDesc(Long empresaId);

    List<DocumentoAgro>
    findAllByEmpresa_IdAndMovimentacao_IdOrderByCriadoEmDesc(
            Long empresaId,
            Long movimentacaoId
    );

    Optional<DocumentoAgro>
    findByIdAndEmpresa_Id(Long documentoId, Long empresaId);

    long countByEmpresa_IdAndMovimentacaoIsNull(Long empresaId);

    long countByEmpresa_IdAndStatus(
            Long empresaId,
            StatusDocumentoAgro status
    );
}
