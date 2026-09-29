package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.assinatura.AssinaturaAcessoService;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AcessoEmpresaAuthorizationManagerTest {

    @Test
    void usuarioComAcessoDiretoValidoPodeAcessarModuloMesmoSemAssinaturaAtiva() {
        AssinaturaAcessoService assinaturaAcessoService =
                mock(AssinaturaAcessoService.class);
        UsuarioRepository usuarioRepository =
                mock(UsuarioRepository.class);
        Usuario usuario =
                mock(Usuario.class);

        when(assinaturaAcessoService.podeAcessarAreaProtegida(1L))
                .thenReturn(false);
        when(usuarioRepository.findByIdAndEmpresa_Id(10L, 1L))
                .thenReturn(Optional.of(usuario));
        when(usuario.possuiAcessoValido(LocalDate.now()))
                .thenReturn(true);

        AcessoEmpresaAuthorizationManager manager =
                new AcessoEmpresaAuthorizationManager(
                        assinaturaAcessoService,
                        usuarioRepository
                );

        AuthorizationResult resultado = manager.authorize(
                () -> autenticacao("PRODUTOR"),
                contexto("/api/v1/empresas/1/dashboard/resumo")
        );

        assertThat(resultado.isGranted()).isTrue();
    }

    @Test
    void usuarioSemAcessoDiretoEComAssinaturaBloqueadaNaoAcessaModulo() {
        AssinaturaAcessoService assinaturaAcessoService =
                mock(AssinaturaAcessoService.class);
        UsuarioRepository usuarioRepository =
                mock(UsuarioRepository.class);
        Usuario usuario =
                mock(Usuario.class);

        when(assinaturaAcessoService.podeAcessarAreaProtegida(1L))
                .thenReturn(false);
        when(usuarioRepository.findByIdAndEmpresa_Id(10L, 1L))
                .thenReturn(Optional.of(usuario));
        when(usuario.possuiAcessoValido(LocalDate.now()))
                .thenReturn(false);

        AcessoEmpresaAuthorizationManager manager =
                new AcessoEmpresaAuthorizationManager(
                        assinaturaAcessoService,
                        usuarioRepository
                );

        AuthorizationResult resultado = manager.authorize(
                () -> autenticacao("PRODUTOR"),
                contexto("/api/v1/empresas/1/dashboard/resumo")
        );

        assertThat(resultado.isGranted()).isFalse();
    }

    private Jwt jwt(String papel) {
        Instant agora = Instant.now();

        return new Jwt(
                "token",
                agora,
                agora.plusSeconds(3600),
                Map.of("alg", "none"),
                Map.of(
                        "sub",
                        "10",
                        "usuarioId",
                        10L,
                        "empresaId",
                        1L,
                        "papel",
                        papel
                )
        );
    }

    private TestingAuthenticationToken autenticacao(String papel) {
        TestingAuthenticationToken autenticacao =
                new TestingAuthenticationToken(
                        jwt(papel),
                        null
                );

        autenticacao.setAuthenticated(true);

        return autenticacao;
    }

    private RequestAuthorizationContext contexto(String uri) {
        RequestAuthorizationContext contexto =
                mock(RequestAuthorizationContext.class);
        HttpServletRequest request =
                mock(HttpServletRequest.class);

        when(contexto.getVariables())
                .thenReturn(Map.of("empresaId", "1"));
        when(contexto.getRequest())
                .thenReturn(request);
        when(request.getRequestURI())
                .thenReturn(uri);

        return contexto;
    }
}
