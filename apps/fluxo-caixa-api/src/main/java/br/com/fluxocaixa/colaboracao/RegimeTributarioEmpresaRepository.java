package br.com.fluxocaixa.colaboracao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RegimeTributarioEmpresaRepository
        extends JpaRepository<RegimeTributarioEmpresa, Long> {

    List<RegimeTributarioEmpresa>
    findAllByEmpresa_IdOrderByDataInicioDescIdDesc(Long empresaId);

    Optional<RegimeTributarioEmpresa>
    findFirstByEmpresa_IdAndDataInicioLessThanEqualAndSituacaoOrderByDataInicioDescIdDesc(
            Long empresaId,
            LocalDate data,
            String situacao);
}
