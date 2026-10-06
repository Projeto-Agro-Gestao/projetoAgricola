package br.com.fluxocaixa.refreshtoken;

import br.com.fluxocaixa.configuracao.PropriedadesSeguranca;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RefreshTokenServiceTest {

    private static final ZoneId ZONA = ZoneOffset.UTC;
    private static final LocalDateTime AGORA =
            LocalDateTime.of(2026, 1, 1, 12, 0);

    private final RefreshTokenRepository repo =
            mock(RefreshTokenRepository.class);

    private final br.com.fluxocaixa.autenticacao.TokenService tokenService =
            mock(br.com.fluxocaixa.autenticacao.TokenService.class);

    private final PropriedadesSeguranca props = new PropriedadesSeguranca(
            new PropriedadesSeguranca.Jwt("emissor", "dest", 900, "segredo"),
            new PropriedadesSeguranca.Cors("http://localhost:5173"),
            new PropriedadesSeguranca.Refresh(
                    7, 30, "agrogestao_refresh", "/api/v1/auth", "None")
    );

    private final Clock clock =
            Clock.fixed(AGORA.atZone(ZONA).toInstant(), ZONA);

    // self aponta para a própria instância: fora do contêiner Spring não há proxy
    // REQUIRES_NEW, mas a chamada ainda executa repo.revogarAtivosDoUsuario.
    private final RefreshTokenService service =
            construir();

    private RefreshTokenService construir() {
        RefreshTokenService[] ref = new RefreshTokenService[1];
        ref[0] = new RefreshTokenService(repo, props, tokenService, clock,
                new RefreshTokenService(repo, props, tokenService, clock, null));
        return ref[0];
    }

    private Usuario usuario() {
        Usuario usuario = new Usuario(
                new Empresa("Fazenda", null),
                "Produtor",
                "produtor@example.test",
                null,
                "hash",
                PapelUsuario.PRODUTOR
        );
        ReflectionTestUtils.setField(usuario, "id", 42L);
        return usuario;
    }

    @Test
    void emitirSemLembrarUsaTtlDeSeteDias() {
        service.emitir(usuario(), false);

        RefreshToken salvo = capturarSalvo();
        assertThat(salvo.getDataExpiracao()).isEqualTo(AGORA.plusDays(7));
    }

    @Test
    void emitirComLembrarUsaTtlDeTrintaDias() {
        service.emitir(usuario(), true);

        RefreshToken salvo = capturarSalvo();
        assertThat(salvo.getDataExpiracao()).isEqualTo(AGORA.plusDays(30));
    }

    @Test
    void rotacaoLigaSubstituidoPorIdNoTokenAntigo() {
        Usuario usuario = usuario();
        RefreshToken antigo = tokenAtivo(usuario, 7);
        when(repo.bloquearPorHash(any())).thenReturn(Optional.of(antigo));
        when(repo.saveAndFlush(any())).thenAnswer(invocacao -> {
            RefreshToken novo = invocacao.getArgument(0);
            ReflectionTestUtils.setField(novo, "id", 99L);
            return novo;
        });

        when(tokenService.gerarToken(any())).thenReturn("novo-access-token");
        when(tokenService.getExpiracaoEmSegundos()).thenReturn(900L);

        RefreshTokenService.Rotacao rotacao = service.rotacionar("tokenCru");

        assertThat(antigo.getSubstituidoPorId()).isEqualTo(99L);
        assertThat(antigo.estaRevogado()).isTrue();
        assertThat(rotacao.refreshTokenCru()).isNotBlank();
        assertThat(rotacao.corpo().token()).isEqualTo("novo-access-token");
        verify(repo, never()).revogarAtivosDoUsuario(anyLong(), any());
    }

    @Test
    void reusoDeTokenJaRotacionadoRevogaTodasAsSessoesELanca401() {
        Usuario usuario = usuario();
        RefreshToken rotacionado = tokenAtivo(usuario, 7);
        rotacionado.substituirPor(50L, AGORA.minusMinutes(1));
        when(repo.bloquearPorHash(any())).thenReturn(Optional.of(rotacionado));

        assertThatThrownBy(() -> service.rotacionar("tokenCru"))
                .isInstanceOf(RefreshTokenInvalidoException.class);

        verify(repo, times(1)).revogarAtivosDoUsuario(eq(42L), any());
        verify(repo, never()).saveAndFlush(any());
    }

    @Test
    void rotacaoDeTokenExpiradoLanca401SemRotacionar() {
        RefreshToken expirado = tokenAtivo(usuario(), 7);
        ReflectionTestUtils.setField(expirado, "dataExpiracao", AGORA.minusDays(1));
        when(repo.bloquearPorHash(any())).thenReturn(Optional.of(expirado));

        assertThatThrownBy(() -> service.rotacionar("tokenCru"))
                .isInstanceOf(RefreshTokenInvalidoException.class);

        verify(repo, never()).saveAndFlush(any());
        verify(repo, never()).revogarAtivosDoUsuario(anyLong(), any());
    }

    @Test
    void rotacaoDeCookieInexistenteLanca401() {
        when(repo.bloquearPorHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rotacionar("tokenCru"))
                .isInstanceOf(RefreshTokenInvalidoException.class);
    }

    @Test
    void logoutRevogaTokenPresente() {
        RefreshToken ativo = tokenAtivo(usuario(), 7);
        when(repo.bloquearPorHash(any())).thenReturn(Optional.of(ativo));

        service.revogar("tokenCru");

        assertThat(ativo.estaRevogado()).isTrue();
    }

    @Test
    void logoutEIdempotenteQuandoTokenAusente() {
        when(repo.bloquearPorHash(any())).thenReturn(Optional.empty());

        service.revogar("tokenCru");
        // sem exceção: logout de cookie inexistente é no-op silencioso
    }

    private RefreshToken tokenAtivo(Usuario usuario, int ttlDias) {
        RefreshToken token = new RefreshToken(
                usuario, "hash", AGORA.plusDays(ttlDias));
        ReflectionTestUtils.setField(token, "dataCriacao", AGORA);
        return token;
    }

    private RefreshToken capturarSalvo() {
        org.mockito.ArgumentCaptor<RefreshToken> captor =
                org.mockito.ArgumentCaptor.forClass(RefreshToken.class);
        verify(repo).save(captor.capture());
        return captor.getValue();
    }

    @SuppressWarnings("unused")
    private Instant instante() {
        return AGORA.atZone(ZONA).toInstant();
    }
}
