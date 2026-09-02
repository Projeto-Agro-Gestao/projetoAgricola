package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            EmpresaRepository empresaRepository,
            CategoriaRepository categoriaRepository,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaRepository = categoriaRepository;
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

        cadastrarCategoriasIniciais(
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

    private void cadastrarCategoriasIniciais(
            Empresa empresa,
            boolean agriculturaAtiva,
            boolean pecuariaAtiva) {

        List<Categoria> categorias = new ArrayList<>();

        adicionarCategoria(
                categorias,
                empresa,
                "Outras receitas",
                TipoMovimentacao.RECEITA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Combustível",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Manutenção",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Outras despesas",
                TipoMovimentacao.DESPESA
        );

        if (agriculturaAtiva) {
            adicionarCategoriasAgricultura(
                    categorias,
                    empresa
            );
        }

        if (pecuariaAtiva) {
            adicionarCategoriasPecuaria(
                    categorias,
                    empresa
            );
        }

        categoriaRepository.saveAll(categorias);
    }

    private void adicionarCategoriasAgricultura(
            List<Categoria> categorias,
            Empresa empresa) {

        adicionarCategoria(
                categorias,
                empresa,
                "Venda da produção",
                TipoMovimentacao.RECEITA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Insumos",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Sementes",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Fertilizantes",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Defensivos",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Máquinas",
                TipoMovimentacao.DESPESA
        );
    }

    private void adicionarCategoriasPecuaria(
            List<Categoria> categorias,
            Empresa empresa) {

        adicionarCategoria(
                categorias,
                empresa,
                "Venda de animais",
                TipoMovimentacao.RECEITA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Venda de leite",
                TipoMovimentacao.RECEITA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Ração",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Medicamentos veterinários",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                empresa,
                "Manejo",
                TipoMovimentacao.DESPESA
        );
    }

    private void adicionarCategoria(
            List<Categoria> categorias,
            Empresa empresa,
            String nome,
            TipoMovimentacao tipo) {

        categorias.add(
                new Categoria(
                        empresa,
                        nome,
                        tipo
                )
        );
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