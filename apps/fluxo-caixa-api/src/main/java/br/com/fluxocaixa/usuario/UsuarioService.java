package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.categoria.CategoriaSugeridaService;
import br.com.fluxocaixa.assinatura.AssinaturaService;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.empresa.DocumentoJaCadastradoException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Objects;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaSugeridaService categoriaSugeridaService;
    private final PasswordEncoder passwordEncoder;
    private final AssinaturaService assinaturaService;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            EmpresaRepository empresaRepository,
            CategoriaSugeridaService categoriaSugeridaService,
            PasswordEncoder passwordEncoder,
            AssinaturaService assinaturaService) {

        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaSugeridaService = categoriaSugeridaService;
        this.passwordEncoder = passwordEncoder;
        this.assinaturaService = assinaturaService;
    }

    @Transactional
    public UsuarioResponse cadastrar(
            CadastrarUsuarioRequest request) {

        String nome = normalizarTextoObrigatorio(
                request.nome()
        );

        String nomeEmpresa = normalizarTextoObrigatorio(
                request.nomeEmpresa()
        );

        String email = normalizarEmail(
                request.email()
        );

        String telefone = normalizarTextoOpcional(
                request.telefone()
        );

        String documento = normalizarDocumentoObrigatorio(
                request.documento()
        );

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailJaCadastradoException();
        }

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

        Empresa empresaSalva =
                empresaRepository.save(empresa);

        categoriaSugeridaService.cadastrarCategoriasIniciais(
                empresaSalva,
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        assinaturaService.iniciarAssinaturaParaNovaEmpresa(
                empresaSalva
        );

        String senhaProtegida =
                passwordEncoder.encode(request.senha());

        Usuario usuario = new Usuario(
                empresaSalva,
                nome,
                email,
                telefone,
                senhaProtegida,
                PapelUsuario.PRODUTOR
        );
        usuario.configurarAcesso(
                true,
                TipoAcessoUsuario.VITALICIO,
                null
        );
        usuario.atualizarPagamento(
                StatusPagamento.ISENTO,
                null
        );

        Usuario usuarioSalvo =
                usuarioRepository.save(usuario);

        return UsuarioResponse.de(usuarioSalvo);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPerfilLogado() {

        return UsuarioResponse.de(buscarUsuarioLogado());
    }

    @Transactional
    public UsuarioResponse atualizarPerfilLogado(
            AtualizarPerfilRequest request) {

        Usuario usuario = buscarUsuarioLogado();

        String nome = normalizarTextoObrigatorio(
                request.nome()
        );

        String nomeEmpresa = normalizarTextoObrigatorio(
                request.nomeEmpresa()
        );

        String telefone = normalizarTextoOpcional(
                request.telefone()
        );

        Empresa empresa = usuario.getEmpresa();
        // Dados legados inalterados nao devem bloquear edicoes independentes do perfil.
        String documento = empresa.getDocumento();
        if (request.documentoPagamento() != null
                && !Objects.equals(request.documentoPagamento(), documento)) {
            documento = normalizarDocumentoOpcional(request.documentoPagamento());
            if (documento != null && !Objects.equals(documento, empresa.getDocumento())) {
                empresaRepository.findByDocumento(documento).ifPresent(existente -> {
                    if (!existente.getId().equals(empresa.getId())) {
                        throw new DocumentoJaCadastradoException();
                    }
                });
            }
        }
        usuario.alterarDados(nome, request.telefone() == null ? usuario.getTelefone() : telefone);
        empresa.alterarNome(nomeEmpresa);
        empresa.alterarDadosCobranca(
                documento,
                request.cepCobranca() == null ? empresa.getCepCobranca()
                        : normalizarDigitosOpcional(request.cepCobranca()),
                textoAtualizado(request.ruaCobranca(), empresa.getRuaCobranca()),
                textoAtualizado(request.numeroCobranca(), empresa.getNumeroCobranca()),
                (request.numeroCobranca() == null || request.numeroCobranca().isBlank())
                        && empresa.isSemNumeroCobranca(),
                empresa.getComplementoCobranca(),
                textoAtualizado(request.bairroCobranca(), empresa.getBairroCobranca()),
                textoAtualizado(request.cidadeCobranca(), empresa.getCidadeCobranca()),
                request.estadoCobranca() == null ? empresa.getEstadoCobranca()
                        : normalizarEstadoOpcional(request.estadoCobranca()),
                empresa.getObservacoesEnderecoCobranca()
        );
        usuario.getEmpresa().alterarDadosFiscais(
                documento,
                request.inscricaoEstadual() == null
                        ? usuario.getEmpresa().getInscricaoEstadual()
                        : normalizarTextoOpcional(request.inscricaoEstadual()),
                request.isentoInscricaoEstadual() == null
                        ? usuario.getEmpresa().isIsentoInscricaoEstadual()
                        : request.isentoInscricaoEstadual(),
                request.inscricaoMunicipal() == null
                        ? usuario.getEmpresa().getInscricaoMunicipal()
                        : normalizarTextoOpcional(request.inscricaoMunicipal()),
                request.isentoInscricaoMunicipal() == null
                        ? usuario.getEmpresa().isIsentoInscricaoMunicipal()
                        : request.isentoInscricaoMunicipal()
        );
        usuario.getEmpresa().configurarAtividades(
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );
        categoriaSugeridaService.garantirCategoriasPorAtividade(
                usuario.getEmpresa(),
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        return UsuarioResponse.de(usuario);
    }

    private Usuario buscarUsuarioLogado() {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal()
                instanceof Jwt jwt)) {
            throw new EntityNotFoundException(
                    "Usuario nao encontrado"
            );
        }

        Long usuarioId = Long.valueOf(jwt.getSubject());

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Usuario nao encontrado"
                ));
    }

    private String textoAtualizado(String recebido, String atual) {
        return recebido == null ? atual : normalizarTextoOpcional(recebido);
    }

    private String normalizarEmail(String email) {

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private String normalizarTextoObrigatorio(String texto) {

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

    private String normalizarDigitosOpcional(String texto) {

        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.replaceAll("[^0-9]", "");
    }

    private String normalizarDocumentoOpcional(String documento) {

        String digitos = normalizarDigitosOpcional(documento);

        if (digitos == null) {
            return null;
        }

        if (digitos.length() != 11 && digitos.length() != 14) {
            throw new IllegalArgumentException(
                    "Informe CPF com 11 digitos ou CNPJ com 14 digitos."
            );
        }

        return digitos;
    }

    private String normalizarDocumentoObrigatorio(String documento) {

        String digitos = normalizarDocumentoOpcional(documento);

        if (digitos == null) {
            throw new IllegalArgumentException(
                    "Informe o CPF ou CNPJ da propriedade."
            );
        }

        return digitos;
    }

    private String normalizarEstadoOpcional(String estado) {

        if (estado == null || estado.isBlank()) {
            return null;
        }

        String valor = estado.trim().toUpperCase(Locale.ROOT);

        if (valor.length() != 2) {
            throw new IllegalArgumentException(
                    "Informe o estado com 2 letras, como SC, PR ou RS."
            );
        }

        return valor;
    }
}
