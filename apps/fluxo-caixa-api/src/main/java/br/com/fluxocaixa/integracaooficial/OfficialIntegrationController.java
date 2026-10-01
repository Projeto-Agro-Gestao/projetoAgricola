package br.com.fluxocaixa.integracaooficial;

import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class OfficialIntegrationController {

    private final OfficialCnpjService cnpjService;
    private final UsuarioRepository usuarioRepository;

    public OfficialIntegrationController(
            OfficialCnpjService cnpjService,
            UsuarioRepository usuarioRepository) {
        this.cnpjService = cnpjService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/admin/integracoes/oficiais/status")
    public OfficialIntegrationStatusResponse status() {
        validarAdmin();
        return cnpjService.status();
    }

    @GetMapping("/admin/integracoes/oficiais/setup")
    public OfficialIntegrationSetupResponse setup() {
        validarAdmin();
        return cnpjService.setup();
    }

    @PostMapping("/admin/integracoes/oficiais/cnpj/testar")
    public OfficialIntegrationStatusResponse testarCnpj() {
        validarAdmin();
        return cnpjService.testarConexao();
    }

    @GetMapping("/cnpj/{cnpj}")
    public CnpjOfficialDataResponse consultarCnpj(
            @PathVariable String cnpj) {
        return cnpjService.consultar(cnpj);
    }

    private void validarAdmin() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Usuario nao autenticado.");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Jwt jwt)) {
            throw new AccessDeniedException("Usuario nao autenticado.");
        }

        Long usuarioId = jwt.getClaim("usuarioId");
        boolean admin = usuarioRepository.findById(usuarioId)
                .map(usuario -> usuario.getPapel()
                        == PapelUsuario.ADMINISTRADOR
                        || usuario.getPapel() == PapelUsuario.SUPER_ADMIN)
                .orElse(false);

        if (!admin) {
            throw new AccessDeniedException(
                    "Acesso restrito a administradores."
            );
        }
    }
}
