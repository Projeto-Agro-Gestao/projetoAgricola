package br.com.fluxocaixa.assinatura;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AssinaturaRepository
        extends JpaRepository<Assinatura, Long> {

    Optional<Assinatura> findByEmpresa_Id(Long empresaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Assinatura a where a.empresa.id = :empresaId")
    Optional<Assinatura> findByEmpresaIdParaCobranca(@Param("empresaId") Long empresaId);
}
