package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.admin.AcessoUsuarioBloqueadoException;
import br.com.fluxocaixa.admin.UsuarioAcesso;
import br.com.fluxocaixa.admin.UsuarioAcessoRepository;
import br.com.fluxocaixa.usuario.EntrarRequest;
import br.com.fluxocaixa.usuario.EntrarResponse;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import br.com.fluxocaixa.usuario.UsuarioResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Locale;

@Service
public class AutenticacaoService {

    private static final ZoneId ZONA_BRASILIA =
            ZoneId.of("America/Sao_Paulo");

    private final UsuarioRepository usuarioRepository;
    private final UsuarioAcessoRepository usuarioAcessoRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AutenticacaoService(
            UsuarioRepository usuarioRepository,
            UsuarioAcessoRepository usuarioAcessoRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService) {

        this.usuarioRepository = usuarioRepository;
        this.usuarioAcessoRepository = usuarioAcessoRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public EntrarResponse entrar(
            EntrarRequest request) {

        String email = normalizarEmail(
                request.email()
        );

        Usuario usuario = usuarioRepository
                .findByEmailIgnoreCase(email)
                .filter(Usuario::isAtivo)
                .orElseThrow(
                        CredenciaisInvalidasException::new
                );

        boolean senhaCorreta = passwordEncoder.matches(
                request.senha(),
                usuario.getSenhaHash()
        );

        if (!senhaCorreta) {
            throw new CredenciaisInvalidasException();
        }

        return emitirSessao(usuario);
    }

    @Transactional
    public EntrarResponse emitirSessao(Usuario usuario) {

        if (!usuario.isAtivo()) {
            throw new CredenciaisInvalidasException();
        }

        if (!isAdministrador(usuario.getPapel())
                && !usuario.possuiAcessoValido(
                LocalDate.now(ZONA_BRASILIA)
        )) {
            throw new AcessoUsuarioBloqueadoException();
        }

        LocalDateTime agora =
                LocalDateTime.now(ZONA_BRASILIA);
        usuario.registrarLogin(agora);
        registrarUso(usuario, agora);

        String token =
                tokenService.gerarToken(usuario);

        return new EntrarResponse(
                token,
                "Bearer",
                tokenService.getExpiracaoEmSegundos(),
                UsuarioResponse.de(usuario)
        );
    }

    private void registrarUso(
            Usuario usuario,
            LocalDateTime agora) {

        UsuarioAcesso acesso = usuarioAcessoRepository
                .findByUsuario_IdAndDataUso(
                        usuario.getId(),
                        agora.toLocalDate()
                )
                .orElseGet(() -> new UsuarioAcesso(
                        usuario,
                        agora.toLocalDate()
                ));

        acesso.registrarUso();
        usuarioAcessoRepository.save(acesso);
    }

    private String normalizarEmail(String email) {

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private boolean isAdministrador(PapelUsuario papel) {
        return papel == PapelUsuario.ADMINISTRADOR
                || papel == PapelUsuario.SUPER_ADMIN;
    }
}
