package br.com.fluxocaixa.admin;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {

        this.adminService = adminService;
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<AdminUsuarioResponse>>
    listarUsuarios() {

        return ResponseEntity.ok(
                adminService.listarUsuarios()
        );
    }

    @PatchMapping("/usuarios/{usuarioId}/acesso")
    public ResponseEntity<AdminUsuarioResponse>
    atualizarAcesso(
            @PathVariable Long usuarioId,
            @Valid @RequestBody
            AtualizarAcessoUsuarioRequest request) {

        return ResponseEntity.ok(
                adminService.atualizarAcesso(
                        usuarioId,
                        request
                )
        );
    }

    @PatchMapping("/usuarios/{usuarioId}/pagamento")
    public ResponseEntity<AdminUsuarioResponse>
    atualizarPagamento(
            @PathVariable Long usuarioId,
            @Valid @RequestBody
            AtualizarPagamentoUsuarioRequest request) {

        return ResponseEntity.ok(
                adminService.atualizarPagamento(
                        usuarioId,
                        request
                )
        );
    }

    @PatchMapping("/usuarios/{usuarioId}/dados")
    public ResponseEntity<AdminUsuarioResponse>
    atualizarDados(
            @PathVariable Long usuarioId,
            @Valid @RequestBody
            AtualizarDadosUsuarioRequest request) {

        return ResponseEntity.ok(
                adminService.atualizarDados(
                        usuarioId,
                        request
                )
        );
    }
}
