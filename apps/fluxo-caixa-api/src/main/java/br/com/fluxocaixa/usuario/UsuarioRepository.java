package br.com.fluxocaixa.usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UsuarioRepository
        extends JpaRepository<Usuario, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    Optional<Usuario> findByIdAndEmpresa_Id(
            Long usuarioId,
            Long empresaId
    );

    Optional<Usuario> findFirstByEmpresa_IdOrderByIdAsc(
            Long empresaId
    );

    List<Usuario> findAllByEmpresa_Id(Long empresaId);
}
