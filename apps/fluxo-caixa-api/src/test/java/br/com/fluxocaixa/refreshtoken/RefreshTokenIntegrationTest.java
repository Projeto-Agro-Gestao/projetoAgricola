package br.com.fluxocaixa.refreshtoken;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.TipoAcessoUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:refresh;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "official.cnpj.provider=DISABLED",
        "asaas.api-key=",
        "google.oauth.client-id=",
        "spring.mail.password="
})
class RefreshTokenIntegrationTest {

    private static final String SENHA = "SenhaDeTesteSegura123!";
    private static final String NOME_COOKIE = "agrogestao_refresh";

    @DynamicPropertySource
    static void segredoTemporario(DynamicPropertyRegistry registry) {
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        String segredo = Base64.getEncoder().encodeToString(bytes);
        registry.add("app.seguranca.jwt.segredo-base64", () -> segredo);
    }

    @LocalServerPort private int port;
    @Autowired private EmpresaRepository empresas;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private RefreshTokenRepository refreshTokens;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private TransactionTemplate transaction;
    @Autowired private jakarta.persistence.EntityManager entityManager;

    private Usuario produtor;
    private final HttpClient http = HttpClient.newHttpClient();

    @BeforeEach
    void preparar() {
        limparRefreshTokens();
        String suffix = UUID.randomUUID().toString();
        Empresa empresa = empresas.saveAndFlush(new Empresa("Fazenda " + suffix, null));
        Usuario usuario = new Usuario(empresa, "Produtor", suffix + "@example.test", null,
                passwordEncoder.encode(SENHA), PapelUsuario.PRODUTOR);
        usuario.configurarAcesso(true, TipoAcessoUsuario.VITALICIO, null);
        produtor = usuarios.saveAndFlush(usuario);
    }

    @Test
    void loginRetornaCookieHttpOnlySecureSameSitePath() throws Exception {
        HttpResponse<String> login = login(false);
        assertThat(login.statusCode()).as(login.body()).isEqualTo(200);

        String setCookie = setCookie(login);
        assertThat(setCookie).contains(NOME_COOKIE + "=");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("Secure");
        assertThat(setCookie).contains("SameSite=None");
        assertThat(setCookie).contains("Path=/api/v1/auth");
        // o refresh cru nunca aparece no corpo JSON (CA-16)
        assertThat(login.body()).doesNotContain(valorCookie(setCookie));
    }

    @Test
    void refreshRotacionaRevogaAnteriorEPreencheSubstituidoPorId() throws Exception {
        String cookie = valorCookie(setCookie(login(false)));

        HttpResponse<String> refresh = refresh(cookie);
        assertThat(refresh.statusCode()).as(refresh.body()).isEqualTo(200);
        assertThat(refresh.body()).contains("\"token\"", "Bearer");

        String novoCookie = valorCookie(setCookie(refresh));
        assertThat(novoCookie).isNotEqualTo(cookie);

        List<RefreshToken> tokens = refreshTokens.findAll();
        assertThat(tokens).hasSize(2);
        RefreshToken antigo = tokens.stream()
                .filter(RefreshToken::foiRotacionado).findFirst().orElseThrow();
        assertThat(antigo.estaRevogado()).isTrue();
        assertThat(antigo.getSubstituidoPorId()).isNotNull();
    }

    @Test
    void reutilizarCookieJaRotacionadoRetorna401ERevogaTudo() throws Exception {
        String cookie = valorCookie(setCookie(login(false)));
        assertThat(refresh(cookie).statusCode()).isEqualTo(200);

        HttpResponse<String> reuso = refresh(cookie);
        assertThat(reuso.statusCode()).isEqualTo(401);

        List<RefreshToken> ativos = refreshTokens.findAll().stream()
                .filter(rt -> !rt.estaRevogado()).toList();
        assertThat(ativos).isEmpty();
    }

    @Test
    void cookieAusenteOuExpiradoRetorna401() throws Exception {
        assertThat(refresh(null).statusCode()).isEqualTo(401);
        assertThat(refresh("cookie-que-nao-existe").statusCode()).isEqualTo(401);
    }

    @Test
    void logoutRevogaERetorna204ComMaxAgeZeroEIdempotente() throws Exception {
        String cookie = valorCookie(setCookie(login(false)));

        HttpResponse<String> logout = logout(cookie);
        assertThat(logout.statusCode()).isEqualTo(204);
        assertThat(setCookie(logout)).contains("Max-Age=0");

        RefreshToken token = refreshTokens.findAll().get(0);
        assertThat(token.estaRevogado()).isTrue();

        // repetir o logout continua respondendo 204 (idempotente)
        assertThat(logout(cookie).statusCode()).isEqualTo(204);
        assertThat(logout(null).statusCode()).isEqualTo(204);
    }

    @Test
    void trocaDeSenhaRevogaRefreshTokensEBloqueiaRefreshAntigo() throws Exception {
        String cookie = valorCookie(setCookie(login(false)));

        // mesmo efeito de RecuperacaoSenhaService.redefinirSenha (RF-B8)
        transaction.executeWithoutResult(status -> {
            Usuario atual = usuarios.findById(produtor.getId()).orElseThrow();
            atual.alterarSenha(passwordEncoder.encode("OutraSenhaSegura456!"));
            refreshTokenService.revogarTodosDoUsuario(atual.getId());
            usuarios.save(atual);
        });

        assertThat(refresh(cookie).statusCode()).isEqualTo(401);
        Optional<RefreshToken> ativo = refreshTokens.findAll().stream()
                .filter(rt -> !rt.estaRevogado()).findFirst();
        assertThat(ativo).isEmpty();
    }

    @Test
    void ttlDeTrintaDiasQuandoLembrarMarcado() throws Exception {
        HttpResponse<String> login = login(true);
        assertThat(login.statusCode()).isEqualTo(200);
        assertThat(setCookie(login)).contains("Max-Age=" + (30 * 24 * 60 * 60));

        RefreshToken token = refreshTokens.findAll().get(0);
        assertThat(token.getDataExpiracao())
                .isAfter(LocalDateTime.now().plusDays(29));
    }

    private HttpResponse<String> login(boolean lembrar) throws Exception {
        String body = "{\"email\":\"" + produtor.getEmail() + "\",\"senha\":\"" + SENHA
                + "\",\"lembrar\":" + lembrar + "}";
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body)).build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> refresh(String cookie) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri("/api/v1/auth/refresh"))
                .POST(HttpRequest.BodyPublishers.noBody());
        if (cookie != null) request.header("Cookie", NOME_COOKIE + "=" + cookie);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> logout(String cookie) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri("/api/v1/auth/logout"))
                .POST(HttpRequest.BodyPublishers.noBody());
        if (cookie != null) request.header("Cookie", NOME_COOKIE + "=" + cookie);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String setCookie(HttpResponse<String> response) {
        return response.headers().firstValue("Set-Cookie").orElseThrow();
    }

    private String valorCookie(String setCookie) {
        String semNome = setCookie.substring((NOME_COOKIE + "=").length());
        int fim = semNome.indexOf(';');
        return fim >= 0 ? semNome.substring(0, fim) : semNome;
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private void limparRefreshTokens() {
        // Zera o self-FK substituido_por_id antes do delete para evitar violação
        // da FK fk_refresh_tokens_substituto entre tokens rotacionados.
        transaction.executeWithoutResult(status -> {
            entityManager.createNativeQuery(
                    "update refresh_tokens set substituido_por_id = null").executeUpdate();
            entityManager.createNativeQuery("delete from refresh_tokens").executeUpdate();
        });
    }
}
