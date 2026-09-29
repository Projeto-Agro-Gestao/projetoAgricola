package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnaliseFiscalMovimentacaoRepository
        extends JpaRepository<AnaliseFiscalMovimentacao, Long> {

    List<AnaliseFiscalMovimentacao>
    findAllByEmpresa_IdOrderByAtualizadoEmDesc(Long empresaId);

    Optional<AnaliseFiscalMovimentacao>
    findByEmpresa_IdAndMovimentacao_Id(Long empresaId, Long movimentacaoId);

    long countByEmpresa_IdAndStatus(Long empresaId, StatusAnaliseFiscal status);

    long countByEmpresa_IdAndTratamentoFiscal(
            Long empresaId,
            StatusTratamentoFiscal tratamentoFiscal);
}
