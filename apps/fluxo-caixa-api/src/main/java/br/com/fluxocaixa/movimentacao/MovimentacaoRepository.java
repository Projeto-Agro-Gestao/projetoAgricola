package br.com.fluxocaixa.movimentacao;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.dashboard.TotalDiarioMovimentacaoProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MovimentacaoRepository
        extends JpaRepository<Movimentacao, Long> {

    Optional<Movimentacao> findByIdAndEmpresa_Id(
            Long movimentacaoId,
            Long empresaId
    );

    boolean existsByEmpresa_IdAndCategoria_Id(
            Long empresaId,
            Long categoriaId
    );

    @Modifying(
            clearAutomatically = true,
            flushAutomatically = true
    )
    @Query("""
            UPDATE Movimentacao movimentacao
            SET movimentacao.categoria = :categoriaDestino
            WHERE movimentacao.empresa.id = :empresaId
              AND movimentacao.categoria.id =
                  :categoriaOrigemId
            """)
    int transferirCategoria(
            @Param("empresaId")
            Long empresaId,
            @Param("categoriaOrigemId")
            Long categoriaOrigemId,
            @Param("categoriaDestino")
            Categoria categoriaDestino
    );

    @Query("""
            SELECT movimentacao
            FROM Movimentacao movimentacao
            WHERE movimentacao.empresa.id = :empresaId
              AND movimentacao.dataMovimentacao
                  BETWEEN :dataInicial AND :dataFinal
              AND (
                    :tipo IS NULL
                    OR movimentacao.tipo = :tipo
              )
              AND (
                    :categoriaId IS NULL
                    OR movimentacao.categoria.id = :categoriaId
              )
            """)
    Page<Movimentacao> buscar(
            @Param("empresaId")
            Long empresaId,
            @Param("dataInicial")
            LocalDate dataInicial,
            @Param("dataFinal")
            LocalDate dataFinal,
            @Param("tipo")
            TipoMovimentacao tipo,
            @Param("categoriaId")
            Long categoriaId,
            Pageable pageable
    );

    @Query("""
            SELECT movimentacao
            FROM Movimentacao movimentacao
            WHERE movimentacao.empresa.id = :empresaId
              AND movimentacao.dataMovimentacao
                  BETWEEN :dataInicial AND :dataFinal
              AND (
                    :tipo IS NULL
                    OR movimentacao.tipo = :tipo
              )
              AND (
                    :categoriaId IS NULL
                    OR movimentacao.categoria.id = :categoriaId
              )
            ORDER BY
                movimentacao.dataMovimentacao ASC,
                movimentacao.id ASC
            """)
    List<Movimentacao> buscarParaExportacao(
            @Param("empresaId")
            Long empresaId,
            @Param("dataInicial")
            LocalDate dataInicial,
            @Param("dataFinal")
            LocalDate dataFinal,
            @Param("tipo")
            TipoMovimentacao tipo,
            @Param("categoriaId")
            Long categoriaId
    );

    @Query("""
            SELECT SUM(movimentacao.valor)
            FROM Movimentacao movimentacao
            WHERE movimentacao.empresa.id = :empresaId
              AND movimentacao.tipo = :tipo
              AND movimentacao.dataMovimentacao
                  BETWEEN :dataInicial AND :dataFinal
            """)
    BigDecimal somarPorTipoEPeriodo(
            @Param("empresaId")
            Long empresaId,
            @Param("tipo")
            TipoMovimentacao tipo,
            @Param("dataInicial")
            LocalDate dataInicial,
            @Param("dataFinal")
            LocalDate dataFinal
    );

    @Query("""
            SELECT
                movimentacao.dataMovimentacao AS data,
                movimentacao.tipo AS tipo,
                SUM(movimentacao.valor) AS total
            FROM Movimentacao movimentacao
            WHERE movimentacao.empresa.id = :empresaId
              AND movimentacao.dataMovimentacao
                  BETWEEN :dataInicial AND :dataFinal
            GROUP BY
                movimentacao.dataMovimentacao,
                movimentacao.tipo
            ORDER BY
                movimentacao.dataMovimentacao ASC
            """)
    List<TotalDiarioMovimentacaoProjection>
    somarTotaisDiariosPorPeriodo(
            @Param("empresaId")
            Long empresaId,
            @Param("dataInicial")
            LocalDate dataInicial,
            @Param("dataFinal")
            LocalDate dataFinal
    );
}