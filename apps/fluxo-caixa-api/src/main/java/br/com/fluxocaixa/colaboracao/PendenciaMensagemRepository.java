package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PendenciaMensagemRepository
        extends JpaRepository<PendenciaMensagem, Long> {

    List<PendenciaMensagem>
    findAllByPendencia_IdOrderByCriadoEmAsc(Long pendenciaId);
}
