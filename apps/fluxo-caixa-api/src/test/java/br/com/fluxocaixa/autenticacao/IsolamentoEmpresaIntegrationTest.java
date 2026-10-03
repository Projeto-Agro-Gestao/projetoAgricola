package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.colaboracao.ContadorEmpresa;
import br.com.fluxocaixa.colaboracao.ContadorEmpresaRepository;
import br.com.fluxocaixa.colaboracao.DocumentoAgro;
import br.com.fluxocaixa.colaboracao.DocumentoAgroRepository;
import br.com.fluxocaixa.colaboracao.TipoDocumentoAgro;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.TipoAcessoUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:isolamento;MODE=MySQL;DB_CLOSE_DELAY=-1",
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
class IsolamentoEmpresaIntegrationTest {

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
    @Autowired private ContadorEmpresaRepository vinculos;
    @Autowired private DocumentoAgroRepository documentos;
    @Autowired private MovimentacaoRepository movimentacoes;
    @Autowired private TokenService tokens;
    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @Autowired private TransactionTemplate transaction;

    private Empresa propria;
    private Empresa terceira;
    private Usuario produtor;
    private String token;
    private final HttpClient http = HttpClient.newHttpClient();

    @BeforeEach
    void preparar() {
        String suffix = UUID.randomUUID().toString();
        propria = empresas.saveAndFlush(new Empresa("Propria " + suffix, null));
        terceira = empresas.saveAndFlush(new Empresa("Terceira " + suffix, null));
        produtor = usuario(propria, PapelUsuario.PRODUTOR);
        token = tokens.gerarToken(produtor);
    }

    @Test
    void aplicativoSobeSemIntegracoesExternasEHealthRespondeUp() throws Exception {
        HttpResponse<String> response = get("/actuator/health", null);
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"status\":\"UP\"");
    }

    @Test
    void salvaPerfilComPayloadDaTelaSemCamposFiscaisOpcionais() throws Exception {
        transaction.executeWithoutResult(status -> {
            Empresa empresa = empresas.findById(propria.getId()).orElseThrow();
            empresa.alterarDadosFiscais("52998224725", "IE existente", false, "IM existente", true);
            empresa.alterarDadosCobranca("52998224725", "88813600", "Rua anterior", null,
                    true, "Casa dos fundos", "Centro", "Criciuma", "SC", "Portao lateral");
        });
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/usuarios/meu-perfil"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json; charset=utf-8")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("""
                        {"nomeEmpresa":"Propriedade atualizada","nome":"Responsavel atualizado",
                         "telefone":"48999999999","documentoPagamento":"529.982.247-25",
                         "cepCobranca":"88813-600","ruaCobranca":"Rua atualizada","numeroCobranca":"",
                         "bairroCobranca":"Centro","cidadeCobranca":"Criciuma","estadoCobranca":"sc",
                         "agriculturaAtiva":true,"pecuariaAtiva":true}
                        """)).build();
        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        assertThat(get("/api/v1/usuarios/meu-perfil", token).body()).contains("Propriedade atualizada", "Responsavel atualizado");
        Empresa salva = empresas.findById(propria.getId()).orElseThrow();
        assertThat(salva.getDocumento()).isEqualTo("52998224725");
        assertThat(salva.getRuaCobranca()).isEqualTo("Rua atualizada");
        assertThat(salva.getEstadoCobranca()).isEqualTo("SC");
        assertThat(salva.getInscricaoEstadual()).isEqualTo("IE existente");
        assertThat(salva.getInscricaoMunicipal()).isNull();
        assertThat(salva.isIsentoInscricaoMunicipal()).isTrue();
        assertThat(salva.isSemNumeroCobranca()).isTrue();
        assertThat(salva.getComplementoCobranca()).isEqualTo("Casa dos fundos");
        assertThat(salva.getObservacoesEnderecoCobranca()).isEqualTo("Portao lateral");
    }

    @Test
    void listagemNaoVazaNomeOuDocumentoDeOutraEmpresa() throws Exception {
        HttpResponse<String> response = get("/api/v1/empresas", token);
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains(propria.getNome()).doesNotContain(terceira.getNome());
        assertThat(response.headers().firstValue("Cache-Control").orElse("")).contains("no-store");
    }

    @Test
    void perfilPermiteAlterarIsencaoFiscalQuandoEnviadaExplicitamente() throws Exception {
        transaction.executeWithoutResult(status -> empresas.findById(propria.getId()).orElseThrow()
                .alterarDadosFiscais("11144477735", null, true, null, true));
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/usuarios/meu-perfil"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("""
                        {"nomeEmpresa":"Propriedade","nome":"Responsavel","documentoPagamento":"11144477735",
                         "agriculturaAtiva":true,"pecuariaAtiva":false,
                         "inscricaoEstadual":"123","isentoInscricaoEstadual":false,
                         "inscricaoMunicipal":"456","isentoInscricaoMunicipal":false}
                        """)).build();
        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        Empresa salva = empresas.findById(propria.getId()).orElseThrow();
        assertThat(salva.isIsentoInscricaoEstadual()).isFalse();
        assertThat(salva.isIsentoInscricaoMunicipal()).isFalse();
        assertThat(salva.getInscricaoEstadual()).isEqualTo("123");
        assertThat(salva.getInscricaoMunicipal()).isEqualTo("456");
        assertThat(usuarios.findById(produtor.getId()).orElseThrow().getPapel()).isEqualTo(PapelUsuario.PRODUTOR);
    }

    @Test
    void semTokenNaoListaEmpresas() throws Exception {
        assertThat(get("/api/v1/empresas", null).statusCode()).isEqualTo(401);
    }

    @Test
    void trocarEmpresaNaUrlNaoLiberaFinanceiroFornecedoresOuCobranca() throws Exception {
        for (String endpoint : new String[]{"dashboard/resumo", "movimentacoes", "fornecedores",
                "categorias", "contas-financeiras", "assinatura", "assinatura/notas-fiscais"}) {
            HttpResponse<String> response = get("/api/v1/empresas/" + terceira.getId() + "/" + endpoint, token);
            assertThat(response.statusCode()).as(endpoint).isEqualTo(403);
            assertThat(response.body()).doesNotContain(terceira.getNome());
        }
    }

    @Test
    void trocarEmpresaNaoLiberaDadosContabeisOuExportacao() throws Exception {
        for (String endpoint : new String[]{"pendencias", "documentos", "movimentacoes-fiscais",
                "dashboard-contabil", "regimes-tributarios", "parametros-tributarios"}) {
            assertThat(get("/api/v1/contador/clientes/" + terceira.getId() + "/" + endpoint, token)
                    .statusCode()).as(endpoint).isEqualTo(403);
        }
        assertThat(get("/api/v1/colaboracao/empresas/" + terceira.getId()
                + "/exportacoes/movimentacoes.csv?dataInicial=2026-01-01&dataFinal=2026-12-31", token)
                .statusCode()).isEqualTo(403);
    }

    @Test
    void documentoDeOutraEmpresaNaoPodeSerBaixadoPelaEmpresaPropria() throws Exception {
        Usuario outro = usuario(terceira, PapelUsuario.PRODUTOR);
        DocumentoAgro documento = documentos.saveAndFlush(new DocumentoAgro(terceira, null, outro,
                "privado.txt", "text/plain", 7L, TipoDocumentoAgro.OUTRO, null,
                "SEGREDO".getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        HttpResponse<String> response = get("/api/v1/colaboracao/empresas/" + propria.getId()
                + "/documentos/" + documento.getId() + "/download", token);
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.body()).doesNotContain("SEGREDO");
        assertThat(get("/api/v1/colaboracao/empresas/" + terceira.getId()
                + "/documentos/" + documento.getId() + "/download", token).statusCode()).isEqualTo(403);
    }

    @Test
    void clienteNaoAcessaRotasAdministrativasNemCriaEmpresaAvulsa() throws Exception {
        for (String endpoint : new String[]{"usuarios", "assinaturas", "integracoes/oficiais/status"}) {
            assertThat(get("/api/v1/admin/" + endpoint, token).statusCode()).as(endpoint).isEqualTo(403);
        }
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/empresas"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"nome\":\"Empresa indevida\"}" )).build();
        assertThat(http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
        HttpRequest promocao = HttpRequest.newBuilder(uri("/api/v1/admin/usuarios/" + produtor.getId() + "/papel"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("{\"papel\":\"ADMINISTRADOR\"}")).build();
        assertThat(http.send(promocao, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
        assertThat(usuarios.findById(produtor.getId()).orElseThrow().getPapel()).isEqualTo(PapelUsuario.PRODUTOR);
    }

    @Test
    void movimentacaoEstrangeiraNaoPodeSerLidaOuExcluidaPelaEmpresaPropria() throws Exception {
        Movimentacao movimento = movimentacoes.saveAndFlush(new Movimentacao(terceira, null,
                "DADO FINANCEIRO PRIVADO", new java.math.BigDecimal("5000.00"),
                TipoMovimentacao.DESPESA, java.time.LocalDate.now(), null));
        String endpoint = "/api/v1/empresas/" + propria.getId() + "/movimentacoes/" + movimento.getId();
        HttpResponse<String> response = get(endpoint, token);
        assertThat(response.statusCode()).isEqualTo(404);
        assertThat(response.body()).doesNotContain("DADO FINANCEIRO PRIVADO");
        HttpRequest exclusao = HttpRequest.newBuilder(uri(endpoint))
                .header("Authorization", "Bearer " + token).DELETE().build();
        assertThat(http.send(exclusao, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(404);
        assertThat(movimentacoes.findByIdAndEmpresa_IdAndExcluidaFalse(movimento.getId(), terceira.getId()))
                .isPresent();
    }

    @Test
    void usuarioBloqueadoNaoVeCarteiraOuDocumentos() throws Exception {
        transaction.executeWithoutResult(status -> usuarios.findById(produtor.getId()).orElseThrow()
                .configurarAcesso(false, TipoAcessoUsuario.NORMAL, null));
        assertThat(get("/api/v1/contador/clientes", token).statusCode()).isEqualTo(403);
        assertThat(get("/api/v1/colaboracao/empresas/" + propria.getId() + "/documentos", token)
                .statusCode()).isEqualTo(403);
    }

    @Test
    void contadorPrecisaDeVinculoAtivoERevogacaoValeComMesmoToken() throws Exception {
        Usuario contador = usuario(propria, PapelUsuario.CONTADOR);
        String acesso = tokens.gerarToken(contador);
        String endpoint = "/api/v1/contador/clientes/" + terceira.getId() + "/documentos";
        assertThat(get(endpoint, acesso).statusCode()).isEqualTo(403);
        ContadorEmpresa vinculo = vinculos.saveAndFlush(new ContadorEmpresa(contador, terceira));
        assertThat(get(endpoint, acesso).statusCode()).isEqualTo(200);
        assertThat(get("/api/v1/empresas", acesso).body()).contains(terceira.getNome());
        transaction.executeWithoutResult(status -> vinculos.findById(vinculo.getId()).orElseThrow().encerrar());
        assertThat(get(endpoint, acesso).statusCode()).isEqualTo(403);
        assertThat(get("/api/v1/empresas", acesso).body()).doesNotContain(terceira.getNome());
    }

    @Test
    void exContadorNaoUsaVinculoAntigo() throws Exception {
        Usuario contador = usuario(propria, PapelUsuario.CONTADOR);
        String acesso = tokens.gerarToken(contador);
        vinculos.saveAndFlush(new ContadorEmpresa(contador, terceira));
        transaction.executeWithoutResult(status -> usuarios.findById(contador.getId())
                .orElseThrow().alterarPapel(PapelUsuario.PRODUTOR));
        assertThat(get("/api/v1/contador/clientes/" + terceira.getId() + "/documentos", acesso)
                .statusCode()).isEqualTo(403);
    }

    @Test
    void adminRebaixadoNaoConservaPrivilegiosDoJwtAntigo() throws Exception {
        Usuario admin = usuario(propria, PapelUsuario.ADMINISTRADOR);
        String acesso = tokens.gerarToken(admin);
        assertThat(get("/api/v1/admin/integracoes/oficiais/status", acesso).statusCode()).isEqualTo(200);
        transaction.executeWithoutResult(status -> {
            Usuario atual = usuarios.findById(admin.getId()).orElseThrow();
            atual.alterarPapel(PapelUsuario.PRODUTOR);
            atual.configurarAcesso(false, TipoAcessoUsuario.NORMAL, null);
        });
        assertThat(get("/api/v1/admin/assinaturas", acesso).statusCode()).isEqualTo(403);
        assertThat(get("/api/v1/empresas/" + propria.getId() + "/dashboard/resumo", acesso)
                .statusCode()).isEqualTo(403);
        assertThat(get("/api/v1/auth/me", acesso).body()).contains("PRODUTOR");
    }

    @Test
    void contaDesativadaNaoUsaTokenAindaValido() throws Exception {
        transaction.executeWithoutResult(status -> usuarios.findById(produtor.getId()).orElseThrow().desativar());
        for (String endpoint : new String[]{"/api/v1/auth/me", "/api/v1/empresas",
                "/api/v1/contador/clientes", "/api/v1/empresas/" + propria.getId() + "/assinatura"}) {
            assertThat(get(endpoint, token).statusCode()).as(endpoint).isEqualTo(403);
        }
    }

    @Test
    void acessoNegadoNaoInvalidaSessaoEUsuarioAindaAcessaPropriosDados() throws Exception {
        assertThat(get("/api/v1/admin/usuarios", token).statusCode()).isEqualTo(403);
        assertThat(get("/api/v1/auth/me", token).statusCode()).isEqualTo(200);
        assertThat(get("/api/v1/colaboracao/empresas/" + propria.getId() + "/documentos", token)
                .statusCode()).isEqualTo(200);
    }

    @Test
    void alteracaoDaSenhaRevogaJwtAnteriorENovoTokenFunciona() throws Exception {
        assertThat(get("/api/v1/auth/me", token).statusCode()).isEqualTo(200);
        transaction.executeWithoutResult(status -> usuarios.findById(produtor.getId())
                .orElseThrow().alterarSenha(passwordEncoder.encode("SenhaDeTesteSegura123!")));
        assertThat(get("/api/v1/auth/me", token).statusCode()).isEqualTo(401);
        Usuario atualizado = usuarios.findById(produtor.getId()).orElseThrow();
        org.springframework.test.util.ReflectionTestUtils.setField(atualizado, "empresa", propria);
        assertThat(get("/api/v1/auth/me", tokens.gerarToken(atualizado)).statusCode()).isEqualTo(200);
    }

    @Test
    void falhasDeLoginPersistemMesmoComRollbackEBloqueiamSenhaCorreta() throws Exception {
        transaction.executeWithoutResult(status -> usuarios.findById(produtor.getId())
                .orElseThrow().alterarSenha(passwordEncoder.encode("SenhaDeTesteSegura123!")));
        for (int i = 0; i < 5; i++) {
            assertThat(login(produtor.getEmail(), "SenhaErrada123!").statusCode()).isEqualTo(401);
        }
        Usuario bloqueado = usuarios.findById(produtor.getId()).orElseThrow();
        assertThat(bloqueado.getTentativasLogin()).isEqualTo(5);
        assertThat(bloqueado.getBloqueadoAte()).isNotNull();
        assertThat(login(produtor.getEmail(), "SenhaDeTesteSegura123!").statusCode()).isEqualTo(401);
        transaction.executeWithoutResult(status -> org.springframework.test.util.ReflectionTestUtils.setField(
                usuarios.findById(produtor.getId()).orElseThrow(), "bloqueadoAte", java.time.LocalDateTime.now().minusMinutes(1)));
        assertThat(login(produtor.getEmail(), "SenhaDeTesteSegura123!").statusCode()).isEqualTo(200);
        assertThat(usuarios.findById(produtor.getId()).orElseThrow().getTentativasLogin()).isZero();
    }

    @Test
    void corsBloqueiaSiteEstrangeiroEApiTemCabecalhosDeProtecao() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/auth/me"))
                .header("Origin", "https://site-invasor.vercel.app")
                .header("Access-Control-Request-Method", "GET")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build();
        assertThat(http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
        HttpResponse<String> response = get("/api/v1/auth/me", token);
        assertThat(response.headers().firstValue("X-Content-Type-Options").orElse("")).isEqualTo("nosniff");
        assertThat(response.headers().firstValue("Content-Security-Policy").orElse("")).contains("frame-ancestors 'none'");
        assertThat(response.headers().firstValue("Referrer-Policy").orElse("")).isEqualTo("no-referrer");
    }

    @Test
    void contaAntigaSalvaTelefoneSemRevalidarDocumentoLegadoInalterado() throws Exception {
        String legado = "LEGADO-" + propria.getId();
        transaction.executeWithoutResult(status -> empresas.findById(propria.getId()).orElseThrow()
                .alterarDadosCobranca(legado, "88813600", "Rua antiga", "10", false,
                        "Casa", "Centro", "Criciuma", "SC", "Observacao"));
        var response = atualizarPerfil("\"documentoPagamento\":\"" + legado + "\",");
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        assertThat(usuarios.findById(produtor.getId()).orElseThrow().getTelefone()).isEqualTo("48999999999");
        Empresa salva = empresas.findById(propria.getId()).orElseThrow();
        assertThat(salva.getDocumento()).isEqualTo(legado);
        assertThat(salva.getRuaCobranca()).isEqualTo("Rua antiga");
        assertThat(salva.getCepCobranca()).isEqualTo("88813600");
        assertThat(salva.getNumeroCobranca()).isEqualTo("10");
        assertThat(salva.getEstadoCobranca()).isEqualTo("SC");
    }

    @Test
    void perfilPreservaDocumentoOmitidoERejeitaNovoDocumentoInvalidoSemSalvarTelefone() throws Exception {
        String legado = "ANTIGO-" + propria.getId();
        transaction.executeWithoutResult(status -> empresas.findById(propria.getId()).orElseThrow()
                .alterarDadosFiscais(legado, null, false, null, false));
        var invalido = atualizarPerfil("\"documentoPagamento\":\"123\",");
        assertThat(invalido.statusCode()).isEqualTo(400);
        assertThat(usuarios.findById(produtor.getId()).orElseThrow().getTelefone()).isNull();
        assertThat(atualizarPerfil("").statusCode()).isEqualTo(200);
        assertThat(empresas.findById(propria.getId()).orElseThrow().getDocumento()).isEqualTo(legado);
    }

    @Test
    void perfilNaoPodeUsarDocumentoDeOutraEmpresa() throws Exception {
        String documento = String.format("%011d", terceira.getId());
        transaction.executeWithoutResult(status -> empresas.findById(terceira.getId()).orElseThrow()
                .alterarDadosFiscais(documento, null, false, null, false));
        var response = atualizarPerfil("\"documentoPagamento\":\"" + documento + "\",");
        assertThat(response.statusCode()).as(response.body()).isEqualTo(409);
        assertThat(response.body()).doesNotContain(terceira.getNome(), documento);
        assertThat(empresas.findById(propria.getId()).orElseThrow().getDocumento()).isNull();
        assertThat(usuarios.findById(produtor.getId()).orElseThrow().getTelefone()).isNull();
    }

    private HttpResponse<String> atualizarPerfil(String campos) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/usuarios/meu-perfil"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("{" + campos
                        + "\"nomeEmpresa\":\"Propriedade\",\"nome\":\"Responsavel\","
                        + "\"telefone\":\"48999999999\",\"agriculturaAtiva\":true,\"pecuariaAtiva\":false}"))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> login(String email, String senha) throws Exception {
        String body = new com.fasterxml.jackson.databind.ObjectMapper()
                .writeValueAsString(java.util.Map.of("email", email, "senha", senha));
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/auth/login"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private Usuario usuario(Empresa empresa, PapelUsuario papel) {
        return usuarios.saveAndFlush(new Usuario(empresa, "Usuario teste", UUID.randomUUID()
                + "@example.test", null, "hash-usado-apenas-em-testes", papel));
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private HttpResponse<String> get(String path, String token) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path)).GET();
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
