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
import br.com.fluxocaixa.refreshtoken.RefreshTokenService;
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
    private final TentativasLoginService tentativasLoginService;
    private final RefreshTokenService refreshTokenService;
    private final String hashUsuarioInexistente;

    public AutenticacaoService(
            UsuarioRepository usuarioRepository,
            UsuarioAcessoRepository usuarioAcessoRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            TentativasLoginService tentativasLoginService,
            RefreshTokenService refreshTokenService) {

        this.usuarioRepository = usuarioRepository;
        this.usuarioAcessoRepository = usuarioAcessoRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.tentativasLoginService = tentativasLoginService;
        this.refreshTokenService = refreshTokenService;
        this.hashUsuarioInexistente = passwordEncoder.encode(java.util.UUID.randomUUID().toString());
    }

    @Transactional
    public SessaoEmitida entrar(
            EntrarRequest request) {

        String email = normalizarEmail(
                request.email()
        );

        Usuario usuario = usuarioRepository
                .findByEmailIgnoreCase(email)
                .filter(Usuario::isAtivo)
                .orElse(null);

        if (usuario == null) {
            passwordEncoder.matches(request.senha(), hashUsuarioInexistente);
            throw new CredenciaisInvalidasException();
        }

        if (usuario.getBloqueadoAte() != null
                && usuario.getBloqueadoAte().isAfter(LocalDateTime.now(ZONA_BRASILIA))) {
            throw new CredenciaisInvalidasException();
        }

        boolean senhaCorreta = passwordEncoder.matches(
                request.senha(),
                usuario.getSenhaHash()
        );

        if (!senhaCorreta) {
            tentativasLoginService.registrarFalha(email);
            throw new CredenciaisInvalidasException();
        }

        return emitirSessao(usuario, request.lembrar());
    }

    @Transactional
    public SessaoEmitida emitirSessao(Usuario usuario, boolean lembrar) {

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

        EntrarResponse corpo = new EntrarResponse(
                token,
                "Bearer",
                tokenService.getExpiracaoEmSegundos(),
                UsuarioResponse.de(usuario)
        );

        RefreshTokenService.TokenEmitido refresh =
                refreshTokenService.emitir(usuario, lembrar);

        return new SessaoEmitida(
                corpo,
                refresh.refreshTokenCru(),
                refresh.ttlDias()
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
