package br.com.fluxocaixa.recuperacaosenha;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecuperacaoSenhaRepository
        extends JpaRepository<RecuperacaoSenha, Long> {

    Optional<RecuperacaoSenha> findByTokenHash(
            String tokenHash
    );

    List<RecuperacaoSenha> findByUsuario_IdAndUtilizadoEmIsNull(
            Long usuarioId
    );
}