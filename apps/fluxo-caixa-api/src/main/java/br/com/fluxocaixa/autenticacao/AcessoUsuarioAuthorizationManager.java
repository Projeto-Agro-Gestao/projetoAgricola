package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.function.Supplier;

@Component
public class AcessoUsuarioAuthorizationManager
        implements AuthorizationManager<RequestAuthorizationContext> {

    private final UsuarioRepository usuarioRepository;

    public AcessoUsuarioAuthorizationManager(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorizationResult authorize(Supplier<? extends Authentication> authentication,
                                         RequestAuthorizationContext context) {
        try {
            Usuario usuario = buscarUsuario(authentication.get());
            String uri = context.getRequest().getRequestURI();
            boolean administrativo = uri.startsWith("/api/v1/admin/")
                    || ("/api/v1/empresas".equals(uri)
                    && !"GET".equals(context.getRequest().getMethod()));
            return new AuthorizationDecision(!administrativo
                    || (isAdministrador(usuario) && usuario.isAcessoLiberado()));
        } catch (AccessDeniedException exception) {
            return new AuthorizationDecision(false);
        }
    }

    public Usuario usuarioAtual() {
        return buscarUsuario(SecurityContextHolder.getContext().getAuthentication());
    }

    private Usuario buscarUsuario(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new AccessDeniedException("Acesso negado.");
        }
        Long usuarioId;
        try {
            usuarioId = Long.valueOf(jwt.getSubject());
            Object claim = jwt.getClaim("usuarioId");
            if (claim != null && !usuarioId.toString().equals(claim.toString())) {
                throw new AccessDeniedException("Acesso negado.");
            }
        } catch (NumberFormatException exception) {
            throw new AccessDeniedException("Acesso negado.");
        }
        return usuarioRepository.findById(usuarioId)
                .filter(Usuario::isAtivo)
                .orElseThrow(() -> new AccessDeniedException("Acesso negado."));
    }

    public static boolean isAdministrador(Usuario usuario) {
        return usuario.getPapel() == PapelUsuario.ADMINISTRADOR
                || usuario.getPapel() == PapelUsuario.SUPER_ADMIN;
    }
}
