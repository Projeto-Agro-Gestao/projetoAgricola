package br.com.fluxocaixa.assinatura;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotaFiscalRepository extends JpaRepository<NotaFiscal, Long> {

    List<NotaFiscal> findAllByEmpresa_IdOrderByCriadoEmDescIdDesc(Long empresaId);

    Optional<NotaFiscal> findByPagamento_Id(Long pagamentoId);

    Optional<NotaFiscal> findByPagamento_IdAndEmpresa_Id(
            Long pagamentoId,
            Long empresaId);

    Optional<NotaFiscal> findByAsaasInvoiceId(String asaasInvoiceId);
}
