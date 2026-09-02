package br.com.fluxocaixa.usuario;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioPerfilController {

    private final UsuarioService usuarioService;

    public UsuarioPerfilController(
            UsuarioService usuarioService) {

        this.usuarioService = usuarioService;
    }

    @GetMapping("/meu-perfil")
    public ResponseEntity<UsuarioResponse> buscarPerfil() {

        return ResponseEntity.ok(
                usuarioService.buscarPerfilLogado()
        );
    }

    @PatchMapping("/meu-perfil")
    public ResponseEntity<UsuarioResponse> atualizarPerfil(
            @Valid @RequestBody
            AtualizarPerfilRequest request) {

        return ResponseEntity.ok(
                usuarioService.atualizarPerfilLogado(request)
        );
    }
}
