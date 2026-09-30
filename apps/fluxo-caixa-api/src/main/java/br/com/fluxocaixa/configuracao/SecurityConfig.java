package br.com.fluxocaixa.configuracao;

import br.com.fluxocaixa.autenticacao.AcessoEmpresaAuthorizationManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {

        return PasswordEncoderFactories
                .createDelegatingPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AcessoEmpresaAuthorizationManager
                    acessoEmpresaAuthorizationManager)
            throws Exception {

        http
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
                                "/api/v1/auth/google"
                        )
                        .permitAll()
                        .requestMatchers(
                                "/api/v1/auth/me"
                        )
                        .authenticated()
                        .requestMatchers(
                                "/api/v1/webhooks/asaas"
                        )
                        .permitAll()
                        .requestMatchers(
                                "/api/v1/admin/**"
                        )
                        .authenticated()
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
                        .authenticated()
                        .anyRequest()
                        .denyAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(Customizer.withDefaults())
                );

        return http.build();
    }
}
