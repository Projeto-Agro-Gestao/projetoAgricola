package br.com.fluxocaixa.autenticacao;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthRateLimitFilterTest {
    @Test
    void limitaTentativasMesmoQuandoCabecalhoDeIpMuda() throws Exception {
        AuthRateLimitFilter filtro = new AuthRateLimitFilter(Clock.systemUTC(), 2, 10);
        assertThat(chamar(filtro, "1.2.3.4", "/api/v1/auth/login", "1").getStatus()).isEqualTo(200);
        assertThat(chamar(filtro, "1.2.3.4", "/api/v1/auth/login", "2").getStatus()).isEqualTo(200);
        MockHttpServletResponse response = chamar(filtro, "1.2.3.4", "/api/v1/auth/login", "3");
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("60");
        assertThat(response.getContentAsString()).doesNotContain("1.2.3.4");
        assertThat(chamar(filtro, "5.6.7.8", "/api/v1/auth/login", "3").getStatus()).isEqualTo(200);
    }

    @Test
    void janelaExpiraEPermiteNovaTentativa() throws Exception {
        Clock clock = mock(Clock.class);
        when(clock.millis()).thenReturn(1000L, 1001L, 61000L);
        AuthRateLimitFilter filtro = new AuthRateLimitFilter(clock, 1, 10);
        assertThat(chamar(filtro, "ip", "/api/v1/auth/login", "").getStatus()).isEqualTo(200);
        assertThat(chamar(filtro, "ip", "/api/v1/auth/login", "").getStatus()).isEqualTo(429);
        assertThat(chamar(filtro, "ip", "/api/v1/auth/login", "").getStatus()).isEqualTo(200);
    }

    @Test
    void naoBloqueiaHealthOuWebhooks() throws Exception {
        AuthRateLimitFilter filtro = new AuthRateLimitFilter(Clock.systemUTC(), 1, 10);
        chamar(filtro, "ip", "/api/v1/auth/login", "");
        assertThat(chamar(filtro, "ip", "/actuator/health", "").getStatus()).isEqualTo(200);
        assertThat(chamar(filtro, "ip", "/api/v1/webhooks/asaas", "").getStatus()).isEqualTo(200);
    }

    @Test
    void capacidadeLimitadaNaoPermiteEvasaoPorIpsIlimitados() throws Exception {
        AuthRateLimitFilter filtro = new AuthRateLimitFilter(Clock.systemUTC(), 1, 1);
        chamar(filtro, "ip1", "/api/v1/auth/cadastro", "");
        assertThat(chamar(filtro, "ip2", "/api/v1/auth/cadastro", "").getStatus()).isEqualTo(429);
    }

    private MockHttpServletResponse chamar(AuthRateLimitFilter filtro, String ip, String caminho,
                                           String ipForjado) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", caminho);
        request.setServletPath(caminho);
        request.setRemoteAddr(ip);
        request.addHeader("X-Forwarded-For", ipForjado);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicInteger chamadas = new AtomicInteger();
        filtro.doFilter(request, response, (req, res) -> chamadas.incrementAndGet());
        assertThat(chamadas.get()).isEqualTo(response.getStatus() == 429 ? 0 : 1);
        return response;
    }
}
