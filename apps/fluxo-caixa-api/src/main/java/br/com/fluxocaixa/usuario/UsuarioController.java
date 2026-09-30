package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.autenticacao.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    public UsuarioController(
            UsuarioService usuarioService,
            AutenticacaoService autenticacaoService,
            GoogleAuthService googleAuthService) {

        this.usuarioService = usuarioService;
        this.autenticacaoService = autenticacaoService;
        this.googleAuthService = googleAuthService;
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

        EntrarResponse resposta =
                autenticacaoService.entrar(request);

        return ResponseEntity.ok(resposta);
    }

    @PostMapping("/google")
    public ResponseEntity<EntrarResponse> entrarComGoogle(
            @Valid @RequestBody
            GoogleAuthRequest request) {

        EntrarResponse resposta =
                googleAuthService.autenticar(request);

        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me() {

        return ResponseEntity.ok(
                usuarioService.buscarPerfilLogado()
        );
    }
}
