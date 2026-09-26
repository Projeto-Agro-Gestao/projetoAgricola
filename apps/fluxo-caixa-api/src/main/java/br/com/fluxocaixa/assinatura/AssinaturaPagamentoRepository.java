package br.com.fluxocaixa.assinatura;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssinaturaPagamentoRepository
        extends JpaRepository<AssinaturaPagamento, Long> {

    Optional<AssinaturaPagamento> findByAsaasPaymentId(String asaasPaymentId);

    boolean existsByMovimentacaoIsNotNullAndAsaasPaymentId(String asaasPaymentId);

    List<AssinaturaPagamento>
    findAllByEmpresa_IdOrderByCriadoEmDescIdDesc(Long empresaId);

    Optional<AssinaturaPagamento>
    findFirstByEmpresa_IdOrderByCriadoEmDescIdDesc(Long empresaId);
}
