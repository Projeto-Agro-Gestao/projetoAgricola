package br.com.fluxocaixa.refreshtoken;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rt from RefreshToken rt where rt.tokenHash = :hash")
    Optional<RefreshToken> bloquearPorHash(String hash);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update RefreshToken rt set rt.revogadoEm = :agora "
            + "where rt.usuario.id = :usuarioId and rt.revogadoEm is null")
    int revogarAtivosDoUsuario(Long usuarioId, LocalDateTime agora);
}
