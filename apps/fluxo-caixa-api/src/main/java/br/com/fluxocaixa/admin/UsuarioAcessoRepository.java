package br.com.fluxocaixa.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface UsuarioAcessoRepository
        extends JpaRepository<UsuarioAcesso, Long> {

    Optional<UsuarioAcesso> findByUsuario_IdAndDataUso(
            Long usuarioId,
            LocalDate dataUso
    );

    @Query("""
            select coalesce(sum(acesso.quantidade), 0)
            from UsuarioAcesso acesso
            where acesso.usuario.id = :usuarioId
            """)
    long somarUsosPorUsuario(
            @Param("usuarioId") Long usuarioId
    );

    @Query("""
            select coalesce(sum(acesso.quantidade), 0)
            from UsuarioAcesso acesso
            where acesso.usuario.id = :usuarioId
              and acesso.dataUso = :dataUso
            """)
    long somarUsosPorUsuarioEData(
            @Param("usuarioId")
            Long usuarioId,
            @Param("dataUso")
            LocalDate dataUso
    );

    @Query("""
            select count(acesso.id)
            from UsuarioAcesso acesso
            where acesso.usuario.id = :usuarioId
              and acesso.quantidade > 0
            """)
    long contarDiasComUso(
            @Param("usuarioId") Long usuarioId
    );
}
