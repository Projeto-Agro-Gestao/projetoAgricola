package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoriaSugeridaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaSugeridaService(
            CategoriaRepository categoriaRepository) {

        this.categoriaRepository = categoriaRepository;
    }

    public void cadastrarCategoriasIniciais(
            Empresa empresa,
            boolean agriculturaAtiva,
            boolean pecuariaAtiva) {

        List<CategoriaSugerida> categorias =
                new ArrayList<>();

        adicionarCategoriasBase(categorias);

        if (agriculturaAtiva) {
            adicionarCategoriasAgricultura(categorias);
        }

        if (pecuariaAtiva) {
            adicionarCategoriasPecuaria(categorias);
        }

        salvarCategoriasNovas(empresa, categorias);
    }

    public void garantirCategoriasPorAtividade(
            Empresa empresa,
            boolean agriculturaAtiva,
            boolean pecuariaAtiva) {

        List<CategoriaSugerida> categorias =
                new ArrayList<>();

        if (agriculturaAtiva) {
            adicionarCategoriasAgricultura(categorias);
        }

        if (pecuariaAtiva) {
            adicionarCategoriasPecuaria(categorias);
        }

        salvarCategoriasNovas(empresa, categorias);
    }

    private void adicionarCategoriasBase(
            List<CategoriaSugerida> categorias) {

        adicionarCategoria(
                categorias,
                "Outras receitas",
                TipoMovimentacao.RECEITA,
                AreaCategoria.GERAL
        );

        adicionarCategoria(
                categorias,
                "Combustível",
                TipoMovimentacao.DESPESA,
                AreaCategoria.GERAL
        );

        adicionarCategoria(
                categorias,
                "Manutenção",
                TipoMovimentacao.DESPESA,
                AreaCategoria.GERAL
        );

        adicionarCategoria(
                categorias,
                "Outras despesas",
                TipoMovimentacao.DESPESA,
                AreaCategoria.GERAL
        );
    }

    private void adicionarCategoriasAgricultura(
            List<CategoriaSugerida> categorias) {

        adicionarCategoria(categorias, "Venda de soja", TipoMovimentacao.RECEITA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Venda de milho", TipoMovimentacao.RECEITA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Venda da produção", TipoMovimentacao.RECEITA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Sementes", TipoMovimentacao.DESPESA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Adubo e fertilizantes", TipoMovimentacao.DESPESA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Defensivos agrícolas", TipoMovimentacao.DESPESA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Diesel e combustível", TipoMovimentacao.DESPESA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Máquinas e implementos", TipoMovimentacao.DESPESA, AreaCategoria.AGRICULTURA);
        adicionarCategoria(categorias, "Arrendamento", TipoMovimentacao.DESPESA, AreaCategoria.AGRICULTURA);
    }

    private void adicionarCategoriasPecuaria(
            List<CategoriaSugerida> categorias) {

        adicionarCategoria(categorias, "Venda de gado", TipoMovimentacao.RECEITA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Venda de leite", TipoMovimentacao.RECEITA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Venda de animais", TipoMovimentacao.RECEITA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Ração", TipoMovimentacao.DESPESA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Sal mineral", TipoMovimentacao.DESPESA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Vacinas", TipoMovimentacao.DESPESA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Veterinário", TipoMovimentacao.DESPESA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Pastagem", TipoMovimentacao.DESPESA, AreaCategoria.PECUARIA);
        adicionarCategoria(categorias, "Compra de bezerros", TipoMovimentacao.DESPESA, AreaCategoria.PECUARIA);
    }

    private void adicionarCategoria(
            List<CategoriaSugerida> categorias,
            String nome,
            TipoMovimentacao tipo,
            AreaCategoria area) {

        categorias.add(
                new CategoriaSugerida(
                        nome,
                        tipo,
                        area
                )
        );
    }

    private void salvarCategoriasNovas(
            Empresa empresa,
            List<CategoriaSugerida> categorias) {

        List<Categoria> novasCategorias =
                categorias.stream()
                        .filter(categoria ->
                                !categoriaRepository
                                        .existsByEmpresa_IdAndNomeIgnoreCaseAndTipo(
                                                empresa.getId(),
                                                categoria.nome(),
                                                categoria.tipo()
                                        )
                        )
                        .map(categoria ->
                                new Categoria(
                                        empresa,
                                        categoria.nome(),
                                        categoria.tipo(),
                                        categoria.area()
                                )
                        )
                        .toList();

        if (!novasCategorias.isEmpty()) {
            categoriaRepository.saveAll(novasCategorias);
        }
    }

    private record CategoriaSugerida(
            String nome,
            TipoMovimentacao tipo,
            AreaCategoria area) {
    }
}
