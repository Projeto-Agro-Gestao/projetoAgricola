package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class TentativasLoginService {
    private final UsuarioRepository usuarios;

    public TentativasLoginService(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarFalha(String email) {
        usuarios.buscarParaRegistrarTentativa(email).ifPresent(usuario ->
                usuario.registrarFalhaLogin(LocalDateTime.now(ZoneId.of("America/Sao_Paulo"))));
    }
}
