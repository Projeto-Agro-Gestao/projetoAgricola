package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.autenticacao.AutenticacaoService;
import br.com.fluxocaixa.autenticacao.SessaoEmitida;
import br.com.fluxocaixa.refreshtoken.CookieRefreshFactory;
import br.com.fluxocaixa.refreshtoken.RefreshTokenInvalidoException;
import br.com.fluxocaixa.refreshtoken.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final AutenticacaoService autenticacaoService;
    private final GoogleAuthService googleAuthService;
    private final RefreshTokenService refreshTokenService;
    private final CookieRefreshFactory cookieRefreshFactory;

    public UsuarioController(
            UsuarioService usuarioService,
            AutenticacaoService autenticacaoService,
            GoogleAuthService googleAuthService,
            RefreshTokenService refreshTokenService,
            CookieRefreshFactory cookieRefreshFactory) {

        this.usuarioService = usuarioService;
        this.autenticacaoService = autenticacaoService;
        this.googleAuthService = googleAuthService;
        this.refreshTokenService = refreshTokenService;
        this.cookieRefreshFactory = cookieRefreshFactory;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioResponse> cadastrar(
            @Valid @RequestBody
            CadastrarUsuarioRequest request) {

        UsuarioResponse usuario =
                usuarioService.cadastrar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usuario);
    }

    @PostMapping("/login")
    public ResponseEntity<EntrarResponse> entrar(
            @Valid @RequestBody
            EntrarRequest request) {

        SessaoEmitida sessao =
                autenticacaoService.entrar(request);

        return responderComSessao(sessao);
    }

    @PostMapping("/google")
    public ResponseEntity<EntrarResponse> entrarComGoogle(
            @Valid @RequestBody
            GoogleAuthRequest request) {

        SessaoEmitida sessao =
                googleAuthService.autenticar(request);

        return responderComSessao(sessao);
    }

    @PostMapping("/refresh")
    public ResponseEntity<EntrarResponse> renovar(
            @CookieValue(name = "${app.seguranca.refresh.nome-cookie}", required = false)
            String refreshCookie) {

        if (refreshCookie == null) {
            throw new RefreshTokenInvalidoException();
        }

        RefreshTokenService.Rotacao rotacao =
                refreshTokenService.rotacionar(refreshCookie);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieRefreshFactory
                                .emitir(rotacao.refreshTokenCru(), rotacao.ttlDias())
                                .toString()
                )
                .body(rotacao.corpo());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> sair(
            @CookieValue(name = "${app.seguranca.refresh.nome-cookie}", required = false)
            String refreshCookie) {

        if (refreshCookie != null) {
            refreshTokenService.revogar(refreshCookie);
        }

        return ResponseEntity
                .noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieRefreshFactory.expirar().toString()
                )
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me() {

        return ResponseEntity.ok(
                usuarioService.buscarPerfilLogado()
        );
    }

    private ResponseEntity<EntrarResponse> responderComSessao(
            SessaoEmitida sessao) {

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieRefreshFactory
                                .emitir(sessao.refreshTokenCru(), sessao.refreshTtlDias())
                                .toString()
                )
                .body(sessao.corpo());
    }
}
