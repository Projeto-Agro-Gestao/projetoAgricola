package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.categoria.CategoriaSugeridaService;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaSugeridaService categoriaSugeridaService;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            EmpresaRepository empresaRepository,
            CategoriaSugeridaService categoriaSugeridaService,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaSugeridaService = categoriaSugeridaService;
        this.passwordEncoder = passwordEncoder;
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

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailJaCadastradoException();
        }

        Empresa empresa = new Empresa(
                nomeEmpresa,
                null,
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        Empresa empresaSalva =
                empresaRepository.save(empresa);

        categoriaSugeridaService.cadastrarCategoriasIniciais(
                empresaSalva,
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        String senhaProtegida =
                passwordEncoder.encode(request.senha());

        Usuario usuario = new Usuario(
                empresaSalva,
                nome,
                email,
                telefone,
                senhaProtegida,
                PapelUsuario.PROPRIETARIO
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

        usuario.alterarDados(nome, telefone);
        usuario.getEmpresa().alterarNome(nomeEmpresa);
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
}
