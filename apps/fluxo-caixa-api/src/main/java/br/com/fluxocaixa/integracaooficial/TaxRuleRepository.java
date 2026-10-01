package br.com.fluxocaixa.integracaooficial;

import br.com.fluxocaixa.colaboracao.RegimeTributario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TaxRuleRepository
        extends JpaRepository<TaxRule, Long> {

    List<TaxRule>
    findAllByRegimeAndStatusAndVigenciaInicioLessThanEqualOrderByVigenciaInicioDesc(
            RegimeTributario regime,
            TaxRuleStatus status,
            LocalDate competencia
    );
}
