package br.com.fluxocaixa.contafinanceira;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ContaFinanceiraRepository
        extends JpaRepository<ContaFinanceira, Long> {

    Optional<ContaFinanceira> findByIdAndEmpresa_Id(
            Long contaId,
            Long empresaId
    );

    Optional<ContaFinanceira> findByIdAndEmpresa_IdAndExcluidaFalse(
            Long contaId,
            Long empresaId
    );

    Optional<ContaFinanceira> findByIdAndEmpresa_IdAndExcluidaTrue(
            Long contaId,
            Long empresaId
    );

    List<ContaFinanceira>
    findAllByEmpresa_IdAndExcluidaFalseOrderByDataVencimentoAsc(
            Long empresaId
    );

    List<ContaFinanceira>
    findAllByEmpresa_IdAndExcluidaTrueOrderByExcluidaEmDescIdDesc(
            Long empresaId
    );

    List<ContaFinanceira>
    findAllByEmpresa_IdAndTipoOrderByDataVencimentoAsc(
            Long empresaId,
            TipoContaFinanceira tipo
    );

    List<ContaFinanceira>
    findAllByEmpresa_IdAndSituacaoOrderByDataVencimentoAsc(
            Long empresaId,
            SituacaoContaFinanceira situacao
    );

    @Query("""
            SELECT conta
            FROM ContaFinanceira conta
            WHERE conta.empresa.id = :empresaId
              AND conta.lembreteAtivo = true
              AND conta.excluida = false
              AND conta.situacao IN (
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PENDENTE,
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PARCIAL
              )
              AND conta.dataVencimento <= :dataLimite
            ORDER BY conta.dataVencimento ASC
            """)
    List<ContaFinanceira> buscarLembretes(
            @Param("empresaId")
            Long empresaId,

            @Param("dataLimite")
            LocalDate dataLimite
    );

    @Query("""
            SELECT COALESCE(
                SUM(
                    conta.valorTotal
                    - conta.valorLiquidado
                ),
                0
            )
            FROM ContaFinanceira conta
            WHERE conta.empresa.id = :empresaId
              AND conta.tipo = :tipo
              AND conta.excluida = false
              AND conta.situacao IN (
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PENDENTE,
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PARCIAL
              )
              AND conta.dataVencimento
                  BETWEEN :dataInicial AND :dataFinal
            """)
    BigDecimal somarValorPendentePorPeriodo(
            @Param("empresaId")
            Long empresaId,

            @Param("tipo")
            TipoContaFinanceira tipo,

            @Param("dataInicial")
            LocalDate dataInicial,

            @Param("dataFinal")
            LocalDate dataFinal
    );

    @Query("""
            SELECT COALESCE(
                SUM(
                    conta.valorTotal
                    - conta.valorLiquidado
                ),
                0
            )
            FROM ContaFinanceira conta
            WHERE conta.empresa.id = :empresaId
              AND conta.tipo = :tipo
              AND conta.excluida = false
              AND conta.situacao IN (
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PENDENTE,
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PARCIAL
              )
            """)
    BigDecimal somarTodoValorPendentePorTipo(
            @Param("empresaId")
            Long empresaId,

            @Param("tipo")
            TipoContaFinanceira tipo
    );

    @Query("""
            SELECT
                conta.dataVencimento AS data,

                COALESCE(
                    SUM(
                        CASE
                            WHEN conta.tipo =
                                br.com.fluxocaixa.contafinanceira.TipoContaFinanceira.RECEBER
                            THEN (
                                conta.valorTotal
                                - conta.valorLiquidado
                            )
                            ELSE 0
                        END
                    ),
                    0
                ) AS totalAReceber,

                COALESCE(
                    SUM(
                        CASE
                            WHEN conta.tipo =
                                br.com.fluxocaixa.contafinanceira.TipoContaFinanceira.PAGAR
                            THEN (
                                conta.valorTotal
                                - conta.valorLiquidado
                            )
                            ELSE 0
                        END
                    ),
                    0
                ) AS totalAPagar

            FROM ContaFinanceira conta

            WHERE conta.empresa.id = :empresaId
              AND conta.excluida = false

              AND conta.situacao IN (
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PENDENTE,
                    br.com.fluxocaixa.contafinanceira.SituacaoContaFinanceira.PARCIAL
              )

              AND conta.dataVencimento
                  BETWEEN :dataInicial AND :dataFinal

            GROUP BY conta.dataVencimento

            ORDER BY conta.dataVencimento ASC
            """)
    List<ProjecaoDiariaContaProjection>
    buscarProjecaoDiaria(
            @Param("empresaId")
            Long empresaId,

            @Param("dataInicial")
            LocalDate dataInicial,

            @Param("dataFinal")
            LocalDate dataFinal
    );

    boolean existsByEmpresa_IdAndCategoria_Id(
            Long empresaId,
            Long categoriaId
    );

    boolean existsByEmpresa_IdAndFornecedor_Id(
            Long empresaId,
            Long fornecedorId
    );

    List<ContaFinanceira>
    findAllByEmpresa_IdAndFornecedor_IdAndExcluidaFalseOrderByDataVencimentoDescIdDesc(
            Long empresaId,
            Long fornecedorId
    );

    List<ContaFinanceira>
    findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataVencimentoDescIdDesc(
            Long empresaId
    );
}
