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

        configuracao.setAllowedOriginPatterns(
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

        configuracao.setAllowCredentials(true);

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
        origens.add("https://*.vercel.app");
        origens.add("http://localhost:*");
        origens.add("http://127.0.0.1:*");

        return new ArrayList<>(origens);
    }
}
