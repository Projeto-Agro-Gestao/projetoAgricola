package br.com.fluxocaixa.refreshtoken;

import br.com.fluxocaixa.autenticacao.TokenService;
import br.com.fluxocaixa.configuracao.PropriedadesSeguranca;
import br.com.fluxocaixa.usuario.EntrarResponse;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private static final Logger log =
            LoggerFactory.getLogger(
                    RefreshTokenService.class
            );

    private final RefreshTokenRepository repo;
    private final PropriedadesSeguranca propriedadesSeguranca;
    private final TokenService tokenService;
    private final Clock clock;
    private final RefreshTokenService self;

    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository repo,
            PropriedadesSeguranca propriedadesSeguranca,
            TokenService tokenService,
            Clock clock,
            @Lazy RefreshTokenService self) {

        this.repo = repo;
        this.propriedadesSeguranca = propriedadesSeguranca;
        this.tokenService = tokenService;
        this.clock = clock;
        this.self = self;
    }

    public record TokenEmitido(
            String refreshTokenCru,
            long ttlDias) {
    }

    public record Rotacao(
            EntrarResponse corpo,
            String refreshTokenCru,
            long ttlDias) {
    }

    @Transactional
    public TokenEmitido emitir(
            Usuario usuario,
            boolean lembrar) {

        LocalDateTime agora = LocalDateTime.now(clock);

        int ttlDias = lembrar
                ? propriedadesSeguranca.refresh().expiracaoDiasLembrar()
                : propriedadesSeguranca.refresh().expiracaoDias();

        String tokenCru = gerarTokenSeguro();

        RefreshToken token = new RefreshToken(
                usuario,
                gerarHashToken(tokenCru),
                agora.plusDays(ttlDias)
        );

        repo.save(token);

        return new TokenEmitido(tokenCru, ttlDias);
    }

    @Transactional
    public Rotacao rotacionar(
            String tokenCru) {

        LocalDateTime agora = LocalDateTime.now(clock);

        RefreshToken antigo = repo
                .bloquearPorHash(gerarHashToken(tokenCru))
                .orElseThrow(RefreshTokenInvalidoException::new);

        if (antigo.estaExpirado(agora)
                || (antigo.estaRevogado() && !antigo.foiRotacionado())) {
            throw new RefreshTokenInvalidoException();
        }

        if (antigo.foiRotacionado()) {
            // Reuso de token já rotacionado: trata como credencial comprometida
            // e revoga todas as sessões ativas do usuário (RF-B7). A revogação roda
            // numa transação própria (REQUIRES_NEW) para persistir mesmo com o
            // rollback provocado pelo 401 lançado logo abaixo.
            self.revogarPorReuso(antigo.getUsuario().getId(), agora);
            throw new RefreshTokenInvalidoException();
        }

        Usuario usuario = antigo.getUsuario();

        // Preserva a janela de vida original (7d ou 30d "lembrar") sem persistir o
        // flag: a nova expiração mantém a mesma duração total do token anterior.
        // ponytail: data_criacao é insertable=false (default do banco, V34); se vier
        // null (ex.: harness sem default), recai no TTL padrão de expiracao-dias.
        long ttlDias = antigo.getDataCriacao() != null
                ? Math.max(1, java.time.Duration
                        .between(antigo.getDataCriacao(), antigo.getDataExpiracao())
                        .toDays())
                : propriedadesSeguranca.refresh().expiracaoDias();

        String novoCru = gerarTokenSeguro();

        RefreshToken novo = repo.saveAndFlush(new RefreshToken(
                usuario,
                gerarHashToken(novoCru),
                agora.plusDays(ttlDias)
        ));

        antigo.substituirPor(novo.getId(), agora);

        // Monta o corpo DENTRO da transação: o usuário (e empresa) são LAZY e
        // ficariam detached se lidos no controller após o commit.
        EntrarResponse corpo = new EntrarResponse(
                tokenService.gerarToken(usuario),
                "Bearer",
                tokenService.getExpiracaoEmSegundos(),
                UsuarioResponse.de(usuario)
        );

        return new Rotacao(corpo, novoCru, ttlDias);
    }

    @Transactional
    public void revogar(String tokenCru) {

        LocalDateTime agora = LocalDateTime.now(clock);

        Optional<RefreshToken> encontrado =
                repo.bloquearPorHash(gerarHashToken(tokenCru));

        encontrado.ifPresent(token -> token.revogar(agora));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revogarPorReuso(Long usuarioId, LocalDateTime agora) {

        int revogados = repo.revogarAtivosDoUsuario(usuarioId, agora);
        log.warn(
                "Reuso de refresh token detectado para o usuário {}. "
                        + "Revogadas {} sessões ativas.",
                usuarioId,
                revogados
        );
    }

    @Transactional
    public void revogarTodosDoUsuario(Long usuarioId) {

        repo.revogarAtivosDoUsuario(usuarioId, LocalDateTime.now(clock));
    }

    private String gerarTokenSeguro() {

        byte[] bytes = new byte[32];

        secureRandom.nextBytes(bytes);

        return Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String gerarHashToken(
            String token) {

        try {

            MessageDigest messageDigest =
                    MessageDigest.getInstance(
                            "SHA-256"
                    );

            byte[] hash =
                    messageDigest.digest(
                            token.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return HexFormat.of()
                    .formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {

            throw new IllegalStateException(
                    "Não foi possível gerar o hash do token.",
                    exception
            );
        }
    }
}
