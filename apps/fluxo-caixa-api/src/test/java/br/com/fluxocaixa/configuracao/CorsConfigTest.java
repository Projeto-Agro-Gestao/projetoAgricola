package br.com.fluxocaixa.configuracao;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CorsConfigTest {
    @Test
    void origemDeTerceirosNaVercelNaoEstaAutorizada() {
        var config = configurar("http://localhost:5173").getCorsConfiguration(new MockHttpServletRequest("GET", "/api/v1/auth/me"));
        assertThat(config.checkOrigin("https://site-invasor.vercel.app")).isNull();
        assertThat(config.checkOrigin("https://projeto-agricola-gamma.vercel.app"))
                .isEqualTo("https://projeto-agricola-gamma.vercel.app");
        assertThat(config.getAllowCredentials()).isTrue();
        assertThat(config.checkOrigin("http://localhost:9999")).isNull();
    }

    @Test
    void rejeitaWildcardOuOrigemHttpExterna() {
        for (String origin : new String[]{"https://*.vercel.app", "*", "http://example.com", "https://example.com/path"}) {
            assertThatThrownBy(() -> configurar(origin)).isInstanceOf(IllegalStateException.class);
        }
    }

    private org.springframework.web.cors.CorsConfigurationSource configurar(String origin) {
        return new CorsConfig(new PropriedadesSeguranca(null, new PropriedadesSeguranca.Cors(origin),
                new PropriedadesSeguranca.Refresh(7, 30, "agrogestao_refresh", "/api/v1/auth", "None")))
                .corsConfigurationSource();
    }
}
