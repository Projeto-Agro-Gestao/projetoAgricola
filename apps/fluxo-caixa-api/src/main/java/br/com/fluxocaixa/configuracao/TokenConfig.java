package br.com.fluxocaixa.configuracao;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import br.com.fluxocaixa.autenticacao.VersaoAutenticacaoTokenValidator;

@Configuration
@EnableConfigurationProperties(
        PropriedadesSeguranca.class
)
public class TokenConfig {

    private static final int
            TAMANHO_MINIMO_CHAVE_BYTES = 64;

    @Bean
    public SecretKey jwtSecretKey(
            PropriedadesSeguranca propriedades) {

        String segredoBase64 =
                propriedades
                        .jwt()
                        .segredoBase64();

        byte[] bytesDaChave;

        try {
            bytesDaChave =
                    Base64.getDecoder()
                            .decode(segredoBase64);
        } catch (IllegalArgumentException exception) {

            throw new IllegalStateException(
                    "JWT_SECRET_BASE64 não contém "
                            + "uma chave Base64 válida",
                    exception
            );
        }

        if (
                bytesDaChave.length
                        < TAMANHO_MINIMO_CHAVE_BYTES
        ) {
            throw new IllegalStateException(
                    "JWT_SECRET_BASE64 deve possuir "
                            + "pelo menos 64 bytes "
                            + "antes da codificação Base64"
            );
        }

        return new SecretKeySpec(
                bytesDaChave,
                "HmacSHA512"
        );
    }

    @Bean
    public JwtEncoder jwtEncoder(
            SecretKey jwtSecretKey) {

        return NimbusJwtEncoder
                .withSecretKey(jwtSecretKey)
                .algorithm(MacAlgorithm.HS512)
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
            SecretKey jwtSecretKey,
            PropriedadesSeguranca propriedades,
            VersaoAutenticacaoTokenValidator versaoAutenticacaoTokenValidator) {

        NimbusJwtDecoder decoder =
                NimbusJwtDecoder
                        .withSecretKey(jwtSecretKey)
                        .macAlgorithm(
                                MacAlgorithm.HS512
                        )
                        .build();

        OAuth2TokenValidator<Jwt>
                validadorPadraoEEmissor =
                JwtValidators
                        .createDefaultWithIssuer(
                                propriedades
                                        .jwt()
                                        .emissor()
                        );

        OAuth2TokenValidator<Jwt>
                validadorDestinatario =
                criarValidadorDestinatario(
                        propriedades
                                .jwt()
                                .destinatario()
                );

        decoder.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(
                        validadorPadraoEEmissor,
                        validadorDestinatario,
                        versaoAutenticacaoTokenValidator
                )
        );

        return decoder;
    }

    private OAuth2TokenValidator<Jwt>
    criarValidadorDestinatario(
            String destinatarioEsperado) {

        return jwt -> {

            boolean destinatarioValido =
                    jwt.getAudience()
                            .contains(
                                    destinatarioEsperado
                            );

            if (destinatarioValido) {
                return OAuth2TokenValidatorResult
                        .success();
            }

            OAuth2Error erro =
                    new OAuth2Error(
                            "invalid_token",
                            "O token não foi emitido "
                                    + "para esta aplicação",
                            null
                    );

            return OAuth2TokenValidatorResult
                    .failure(erro);
        };
    }
}
