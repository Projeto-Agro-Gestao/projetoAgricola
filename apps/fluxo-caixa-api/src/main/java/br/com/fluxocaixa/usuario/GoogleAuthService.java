package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.assinatura.AssinaturaService;
import br.com.fluxocaixa.autenticacao.AutenticacaoService;
import br.com.fluxocaixa.categoria.CategoriaSugeridaService;
import br.com.fluxocaixa.configuracao.GoogleOAuthProperties;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.empresa.DocumentoJaCadastradoException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;

@Service
public class GoogleAuthService {

    private static final String GOOGLE_TOKEN_INFO_URL =
            "https://oauth2.googleapis.com";

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaSugeridaService categoriaSugeridaService;
    private final AssinaturaService assinaturaService;
    private final PasswordEncoder passwordEncoder;
    private final AutenticacaoService autenticacaoService;
    private final GoogleOAuthProperties googleOAuthProperties;
    private final RestClient googleClient;
    private final SecureRandom secureRandom = new SecureRandom();

    public GoogleAuthService(
            UsuarioRepository usuarioRepository,
            EmpresaRepository empresaRepository,
            CategoriaSugeridaService categoriaSugeridaService,
            AssinaturaService assinaturaService,
            PasswordEncoder passwordEncoder,
            AutenticacaoService autenticacaoService,
            GoogleOAuthProperties googleOAuthProperties,
            RestClient.Builder restClientBuilder) {

        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaSugeridaService = categoriaSugeridaService;
        this.assinaturaService = assinaturaService;
        this.passwordEncoder = passwordEncoder;
        this.autenticacaoService = autenticacaoService;
        this.googleOAuthProperties = googleOAuthProperties;
        this.googleClient = restClientBuilder
                .baseUrl(GOOGLE_TOKEN_INFO_URL)
                .build();
    }

    @Transactional
    public br.com.fluxocaixa.autenticacao.SessaoEmitida autenticar(GoogleAuthRequest request) {

        if (!googleOAuthProperties.habilitado()) {
            throw new IllegalArgumentException(
                    "Cadastro com Google indisponivel. Configure GOOGLE_CLIENT_ID."
            );
        }

        GoogleTokenInfo tokenInfo =
                validarToken(request.credential());

        String email = normalizarEmail(tokenInfo.email());

        return usuarioRepository
                .findByEmailIgnoreCase(email)
                .map(usuario -> {
                    usuario.marcarEmailVerificado();
                    return autenticacaoService.emitirSessao(usuario, false);
                })
                .orElseGet(() -> cadastrarNovoUsuario(
                        request,
                        tokenInfo,
                        email
                ));
    }

    private br.com.fluxocaixa.autenticacao.SessaoEmitida cadastrarNovoUsuario(
            GoogleAuthRequest request,
            GoogleTokenInfo tokenInfo,
            String email) {

        String nomeEmpresa =
                normalizarTextoObrigatorio(
                        request.nomeEmpresa(),
                        "Conclua o cadastro com Google informando o nome da propriedade."
                );

        if (!request.agriculturaAtiva()
                && !request.pecuariaAtiva()) {
            throw new IllegalArgumentException(
                    "Escolha Agricultura, Pecuaria ou as duas atividades."
            );
        }

        String nome = normalizarNomeGoogle(
                tokenInfo.name(),
                email
        );

        String telefone =
                normalizarTextoOpcional(request.telefone());

        String documento =
                normalizarDocumentoObrigatorio(request.documento());

        if (empresaRepository.existsByDocumento(documento)) {
            throw new DocumentoJaCadastradoException(documento);
        }

        Empresa empresa = new Empresa(
                nomeEmpresa,
                documento,
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        empresa.alterarDadosFiscais(
                documento,
                normalizarTextoOpcional(request.inscricaoEstadual()),
                request.isentoInscricaoEstadual(),
                normalizarTextoOpcional(request.inscricaoMunicipal()),
                request.isentoInscricaoMunicipal()
        );

        Empresa empresaSalva = empresaRepository.save(empresa);

        categoriaSugeridaService.cadastrarCategoriasIniciais(
                empresaSalva,
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        assinaturaService.iniciarAssinaturaParaNovaEmpresa(
                empresaSalva
        );

        Usuario usuario = new Usuario(
                empresaSalva,
                nome,
                email,
                telefone,
                passwordEncoder.encode(gerarSenhaTecnica()),
                PapelUsuario.PRODUTOR
        );

        usuario.marcarEmailVerificado();
        usuario.configurarAcesso(
                true,
                TipoAcessoUsuario.VITALICIO,
                null
        );
        usuario.atualizarPagamento(
                StatusPagamento.ISENTO,
                null
        );

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        return autenticacaoService.emitirSessao(usuarioSalvo, false);
    }

    private GoogleTokenInfo validarToken(String credential) {

        String token = normalizarTextoObrigatorio(
                credential,
                "Credencial do Google invalida."
        );

        GoogleTokenInfo tokenInfo;

        try {
            tokenInfo = googleClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", token)
                            .build()
                    )
                    .retrieve()
                    .body(GoogleTokenInfo.class);
        } catch (RestClientResponseException erro) {
            throw new IllegalArgumentException(
                    "Credencial do Google invalida."
            );
        }

        if (tokenInfo == null) {
            throw new IllegalArgumentException(
                    "Nao foi possivel validar a conta Google."
            );
        }

        validarAudiencia(tokenInfo);
        validarEmissor(tokenInfo);
        validarExpiracao(tokenInfo);
        validarEmail(tokenInfo);

        return tokenInfo;
    }

    private void validarAudiencia(GoogleTokenInfo tokenInfo) {

        if (!googleOAuthProperties.clientId().equals(
                tokenInfo.aud()
        )) {
            throw new IllegalArgumentException(
                    "Credencial do Google nao pertence a este aplicativo."
            );
        }
    }

    private void validarEmissor(GoogleTokenInfo tokenInfo) {

        String iss = tokenInfo.iss();

        if (!"accounts.google.com".equals(iss)
                && !"https://accounts.google.com".equals(iss)) {
            throw new IllegalArgumentException(
                    "Emissor da credencial Google invalido."
            );
        }
    }

    private void validarExpiracao(GoogleTokenInfo tokenInfo) {

        try {
            long epochSeconds = Long.parseLong(tokenInfo.exp());

            if (!Instant.ofEpochSecond(epochSeconds)
                    .isAfter(Instant.now())) {
                throw new IllegalArgumentException(
                        "Credencial do Google expirada."
                );
            }
        } catch (NumberFormatException erro) {
            throw new IllegalArgumentException(
                    "Expiracao da credencial Google invalida."
            );
        }
    }

    private void validarEmail(GoogleTokenInfo tokenInfo) {

        if (tokenInfo.email() == null
                || tokenInfo.email().isBlank()
                || !"true".equalsIgnoreCase(
                tokenInfo.emailVerified()
        )) {
            throw new IllegalArgumentException(
                    "Use uma conta Google com e-mail verificado."
            );
        }
    }

    private String normalizarEmail(String email) {

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private String normalizarNomeGoogle(
            String nomeGoogle,
            String email) {

        if (nomeGoogle != null && !nomeGoogle.isBlank()) {
            return nomeGoogle
                    .trim()
                    .replaceAll("\\s+", " ");
        }

        return email.substring(0, email.indexOf('@'));
    }

    private String normalizarTextoObrigatorio(
            String texto,
            String mensagem) {

        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException(mensagem);
        }

        return texto
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizarTextoOpcional(String texto) {

        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizarDocumentoObrigatorio(String documento) {

        if (documento == null || documento.isBlank()) {
            throw new IllegalArgumentException(
                    "Conclua o cadastro informando o CPF ou CNPJ da propriedade."
            );
        }

        String digitos = documento.replaceAll("[^0-9]", "");

        if (digitos.length() != 11 && digitos.length() != 14) {
            throw new IllegalArgumentException(
                    "Informe CPF com 11 digitos ou CNPJ com 14 digitos."
            );
        }

        return digitos;
    }

    private String gerarSenhaTecnica() {

        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private record GoogleTokenInfo(
            String aud,
            String iss,
            String exp,
            String email,
            String name,
            String sub,
            @com.fasterxml.jackson.annotation.JsonProperty(
                    "email_verified"
            )
            String emailVerified
    ) {
    }
}
