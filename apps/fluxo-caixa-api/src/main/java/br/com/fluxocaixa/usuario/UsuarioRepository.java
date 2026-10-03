package br.com.fluxocaixa.usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;

public interface UsuarioRepository
        extends JpaRepository<Usuario, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where lower(u.email) = lower(:email)")
    Optional<Usuario> buscarParaRegistrarTentativa(String email);

    @Query("select u.versaoAutenticacao from Usuario u where u.id = :id")
    Optional<Long> buscarVersaoAutenticacao(Long id);

    Optional<Usuario> findByIdAndEmpresa_Id(
            Long usuarioId,
            Long empresaId
    );

    Optional<Usuario> findFirstByEmpresa_IdOrderByIdAsc(
            Long empresaId
    );

    List<Usuario> findAllByEmpresa_Id(Long empresaId);

    long countByPapelInAndAtivoTrue(
            Collection<PapelUsuario> papeis
    );

    long countByPapelInAndAtivoTrueAndIdNot(
            Collection<PapelUsuario> papeis,
            Long usuarioId
    );
}
