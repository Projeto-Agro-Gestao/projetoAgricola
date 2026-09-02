package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.configuracao.PropriedadesSeguranca;
import br.com.fluxocaixa.usuario.Usuario;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;

    private final PropriedadesSeguranca
            propriedadesSeguranca;

    public TokenService(
            JwtEncoder jwtEncoder,
            PropriedadesSeguranca
                    propriedadesSeguranca) {

        this.jwtEncoder = jwtEncoder;

        this.propriedadesSeguranca =
                propriedadesSeguranca;
    }

    public String gerarToken(
            Usuario usuario) {

        Instant agora = Instant.now();

        long expiracaoEmSegundos =
                getExpiracaoEmSegundos();

        Instant expiracao =
                agora.plusSeconds(
                        expiracaoEmSegundos
                );

        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(
                                propriedadesSeguranca
                                        .jwt()
                                        .emissor()
                        )
                        .issuedAt(agora)
                        .notBefore(agora)
                        .expiresAt(expiracao)
                        .subject(
                                usuario
                                        .getId()
                                        .toString()
                        )
                        .audience(
                                List.of(
                                        propriedadesSeguranca
                                                .jwt()
                                                .destinatario()
                                )
                        )
                        .id(
                                UUID.randomUUID()
                                        .toString()
                        )
                        .claim(
                                "tipoToken",
                                "access"
                        )
                        .claim(
                                "usuarioId",
                                usuario.getId()
                        )
                        .claim(
                                "empresaId",
                                usuario
                                        .getEmpresa()
                                        .getId()
                        )
                        .claim(
                                "papel",
                                usuario
                                        .getPapel()
                                        .name()
                        )
                        .build();

        return jwtEncoder
                .encode(
                        JwtEncoderParameters.from(
                                claims
                        )
                )
                .getTokenValue();
    }

    public long getExpiracaoEmSegundos() {

        return propriedadesSeguranca
                .jwt()
                .expiracaoSegundos();
    }
}