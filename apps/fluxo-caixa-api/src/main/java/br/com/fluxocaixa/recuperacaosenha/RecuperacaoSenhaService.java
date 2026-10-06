package br.com.fluxocaixa.recuperacaosenha;

import br.com.fluxocaixa.refreshtoken.RefreshTokenService;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class RecuperacaoSenhaService {

    private static final Logger log =
            LoggerFactory.getLogger(
                    RecuperacaoSenhaService.class
            );

    private final UsuarioRepository usuarioRepository;
    private final RecuperacaoSenhaRepository recuperacaoSenhaRepository;
    private final EmailRecuperacaoSenhaService emailRecuperacaoSenhaService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    private final int expiracaoMinutos;
    private final String urlRecuperacaoSenha;

    private final SecureRandom secureRandom = new SecureRandom();

    public RecuperacaoSenhaService(
            UsuarioRepository usuarioRepository,
            RecuperacaoSenhaRepository recuperacaoSenhaRepository,
            EmailRecuperacaoSenhaService emailRecuperacaoSenhaService,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            @Value("${app.seguranca.recuperacao-senha.expiracao-minutos}")
            int expiracaoMinutos,
            @Value("${app.seguranca.recuperacao-senha.url}")
            String urlRecuperacaoSenha) {

        this.usuarioRepository = usuarioRepository;
        this.recuperacaoSenhaRepository = recuperacaoSenhaRepository;
        this.emailRecuperacaoSenhaService = emailRecuperacaoSenhaService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.expiracaoMinutos = expiracaoMinutos;
        this.urlRecuperacaoSenha = urlRecuperacaoSenha;
    }

    @Transactional
    public void solicitarRecuperacao(
            String email) {

        Optional<Usuario> usuarioOptional =
                usuarioRepository.findByEmailIgnoreCase(
                        email.trim()
                );

        if (usuarioOptional.isEmpty()) {
            return;
        }

        Usuario usuario = usuarioOptional.get();

        if (!usuario.isAtivo()) {
            return;
        }

        LocalDateTime agora = LocalDateTime.now();

        invalidarTokensAnteriores(
                usuario.getId(),
                agora
        );

        String token = gerarTokenSeguro();
        String tokenHash = gerarHashToken(token);

        RecuperacaoSenha recuperacaoSenha =
                new RecuperacaoSenha(
                        usuario,
                        tokenHash,
                        agora.plusMinutes(
                                expiracaoMinutos
                        )
                );

        recuperacaoSenhaRepository.save(
                recuperacaoSenha
        );

        String linkRecuperacao =
                urlRecuperacaoSenha
                        + "?token="
                        + token;

        try {

            emailRecuperacaoSenhaService.enviar(
                    usuario.getEmail(),
                    usuario.getNome(),
                    linkRecuperacao
            );

        } catch (RuntimeException exception) {

            log.error(
                    "Falha ao enviar e-mail de recuperação de senha "
                            + "para o usuário {}.",
                    usuario.getId(),
                    exception
            );
        }
    }

    @Transactional
    public void redefinirSenha(
            String token,
            String novaSenha) {

        LocalDateTime agora =
                LocalDateTime.now();

        String tokenHash =
                gerarHashToken(token);

        RecuperacaoSenha recuperacaoSenha =
                recuperacaoSenhaRepository
                        .findByTokenHash(tokenHash)
                        .orElseThrow(
                                TokenRecuperacaoSenhaInvalidoException::new
                        );

        if (!recuperacaoSenha.estaValido(agora)) {
            throw new TokenRecuperacaoSenhaInvalidoException();
        }

        Usuario usuario =
                recuperacaoSenha.getUsuario();

        if (!usuario.isAtivo()) {
            throw new TokenRecuperacaoSenhaInvalidoException();
        }

        String novaSenhaHash =
                passwordEncoder.encode(
                        novaSenha
                );

        usuario.alterarSenha(
                novaSenhaHash
        );

        refreshTokenService.revogarTodosDoUsuario(
                usuario.getId()
        );

        recuperacaoSenha.marcarComoUtilizado(
                agora
        );

        usuarioRepository.save(usuario);
        recuperacaoSenhaRepository.save(
                recuperacaoSenha
        );
    }

    private void invalidarTokensAnteriores(
            Long usuarioId,
            LocalDateTime agora) {

        List<RecuperacaoSenha> tokensPendentes =
                recuperacaoSenhaRepository
                        .findByUsuario_IdAndUtilizadoEmIsNull(
                                usuarioId
                        );

        for (RecuperacaoSenha tokenPendente
                : tokensPendentes) {

            tokenPendente.marcarComoUtilizado(
                    agora
            );
        }

        recuperacaoSenhaRepository.saveAll(
                tokensPendentes
        );
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
