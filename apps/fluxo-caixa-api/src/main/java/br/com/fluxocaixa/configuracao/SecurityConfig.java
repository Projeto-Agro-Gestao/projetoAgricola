package br.com.fluxocaixa.configuracao;

import br.com.fluxocaixa.autenticacao.AcessoEmpresaAuthorizationManager;
import br.com.fluxocaixa.autenticacao.AcessoUsuarioAuthorizationManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import br.com.fluxocaixa.autenticacao.AuthRateLimitFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {

        return PasswordEncoderFactories
                .createDelegatingPasswordEncoder();
    }

    @Bean
    public java.time.Clock clock() {
        return java.time.Clock.systemDefaultZone();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AcessoEmpresaAuthorizationManager
                    acessoEmpresaAuthorizationManager,
            AcessoUsuarioAuthorizationManager acessoUsuarioAuthorizationManager)
            throws Exception {

        http
                .addFilterBefore(new AuthRateLimitFilter(), UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'; base-uri 'none'; sandbox"))
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy", "camera=(), microphone=(), geolocation=()")))
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(autorizacao -> autorizacao
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        )
                        .permitAll()
                        .requestMatchers(
                                "/actuator/health"
                        )
                        .permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/login",
                                "/api/v1/auth/cadastro",
                                "/api/v1/auth/google",
                                "/api/v1/auth/esqueci-senha",
                                "/api/v1/auth/redefinir-senha",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/logout"
                        )
                        .permitAll()
                        .requestMatchers(
                                "/api/v1/auth/me"
                        )
                        .access(acessoUsuarioAuthorizationManager)
                        .requestMatchers(
                                "/api/v1/webhooks/asaas"
                        )
                        .permitAll()
                        .requestMatchers(
                                "/api/v1/admin/**"
                        )
                        .access(acessoUsuarioAuthorizationManager)
                        .requestMatchers("/api/v1/empresas")
                        .access(acessoUsuarioAuthorizationManager)
                        .requestMatchers(
                                "/api/v1/empresas/{empresaId}",
                                "/api/v1/empresas/{empresaId}/**"
                        )
                        .access(
                                acessoEmpresaAuthorizationManager
                        )
                        .requestMatchers(
                                "/api/**"
                        )
                        .access(acessoUsuarioAuthorizationManager)
                        .anyRequest()
                        .denyAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(Customizer.withDefaults())
                );

        return http.build();
    }
}
