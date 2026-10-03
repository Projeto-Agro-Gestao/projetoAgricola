package br.com.fluxocaixa.configuracao;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.net.URI;

@Configuration
public class CorsConfig {

    private final PropriedadesSeguranca
            propriedadesSeguranca;

    public CorsConfig(
            PropriedadesSeguranca
                    propriedadesSeguranca) {

        this.propriedadesSeguranca =
                propriedadesSeguranca;
    }

    @Bean
    public CorsConfigurationSource
    corsConfigurationSource() {

        CorsConfiguration configuracao =
                new CorsConfiguration();

        configuracao.setAllowedOrigins(
                origensPermitidas()
        );

        configuracao.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuracao.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "X-Requested-With",
                        "X-CSRF-TOKEN",
                        "Idempotency-Key"
                )
        );

        configuracao.setExposedHeaders(
                List.of(
                        "Location",
                        "X-Request-Id"
                )
        );

        configuracao.setAllowCredentials(false);

        configuracao.setMaxAge(600L);

        UrlBasedCorsConfigurationSource fonte =
                new UrlBasedCorsConfigurationSource();

        fonte.registerCorsConfiguration(
                "/api/**",
                configuracao
        );

        return fonte;
    }

    private List<String> origensPermitidas() {

        Set<String> origens =
                new LinkedHashSet<>();

        Arrays
                .stream(
                        propriedadesSeguranca
                                .cors()
                                .origemWeb()
                                .split(",")
                )
                .map(String::trim)
                .filter(origem -> !origem.isEmpty())
                .forEach(origens::add);

        origens.add("https://projeto-agricola-gamma.vercel.app");
        origens.add("https://projeto-agricola.vercel.app");
        origens.add("https://projetoagricola.tadeu-ar.workers.dev");
        for (String origem : origens) {
            URI uri = URI.create(origem);
            if (origem.contains("*") || uri.getHost() == null || uri.getUserInfo() != null
                    || uri.getQuery() != null || uri.getFragment() != null
                    || (uri.getPath() != null && !uri.getPath().isEmpty())
                    || !("https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && ("localhost".equals(uri.getHost())
                    || "127.0.0.1".equals(uri.getHost()))))) {
                throw new IllegalStateException("Configure CORS com origens exatas e HTTPS; HTTP apenas local.");
            }
        }

        return new ArrayList<>(origens);
    }
}
