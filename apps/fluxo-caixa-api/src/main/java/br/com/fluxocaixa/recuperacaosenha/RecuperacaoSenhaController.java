package br.com.fluxocaixa.recuperacaosenha;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class RecuperacaoSenhaController {

    private final RecuperacaoSenhaService recuperacaoSenhaService;

    public RecuperacaoSenhaController(
            RecuperacaoSenhaService recuperacaoSenhaService) {

        this.recuperacaoSenhaService = recuperacaoSenhaService;
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<Void> solicitarRecuperacao(
            @Valid
            @RequestBody
            SolicitarRecuperacaoSenhaRequest request) {

        recuperacaoSenhaService.solicitarRecuperacao(
                request.email()
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<Void> redefinirSenha(
            @Valid
            @RequestBody
            RedefinirSenhaRequest request) {

        recuperacaoSenhaService.redefinirSenha(
                request.token(),
                request.novaSenha()
        );

        return ResponseEntity.noContent().build();
    }
}