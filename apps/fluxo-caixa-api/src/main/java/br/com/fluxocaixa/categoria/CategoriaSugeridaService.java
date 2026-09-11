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
                TipoMovimentacao.RECEITA
        );

        adicionarCategoria(
                categorias,
                "Combustível",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                "Manutenção",
                TipoMovimentacao.DESPESA
        );

        adicionarCategoria(
                categorias,
                "Outras despesas",
                TipoMovimentacao.DESPESA
        );
    }

    private void adicionarCategoriasAgricultura(
            List<CategoriaSugerida> categorias) {

        adicionarCategoria(categorias, "Venda de soja", TipoMovimentacao.RECEITA);
        adicionarCategoria(categorias, "Venda de milho", TipoMovimentacao.RECEITA);
        adicionarCategoria(categorias, "Venda da produção", TipoMovimentacao.RECEITA);
        adicionarCategoria(categorias, "Sementes", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Adubo e fertilizantes", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Defensivos agrícolas", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Diesel e combustível", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Máquinas e implementos", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Arrendamento", TipoMovimentacao.DESPESA);
    }

    private void adicionarCategoriasPecuaria(
            List<CategoriaSugerida> categorias) {

        adicionarCategoria(categorias, "Venda de gado", TipoMovimentacao.RECEITA);
        adicionarCategoria(categorias, "Venda de leite", TipoMovimentacao.RECEITA);
        adicionarCategoria(categorias, "Venda de animais", TipoMovimentacao.RECEITA);
        adicionarCategoria(categorias, "Ração", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Sal mineral", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Vacinas", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Veterinário", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Pastagem", TipoMovimentacao.DESPESA);
        adicionarCategoria(categorias, "Compra de bezerros", TipoMovimentacao.DESPESA);
    }

    private void adicionarCategoria(
            List<CategoriaSugerida> categorias,
            String nome,
            TipoMovimentacao tipo) {

        categorias.add(new CategoriaSugerida(nome, tipo));
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
                                        categoria.tipo()
                                )
                        )
                        .toList();

        if (!novasCategorias.isEmpty()) {
            categoriaRepository.saveAll(novasCategorias);
        }
    }

    private record CategoriaSugerida(
            String nome,
            TipoMovimentacao tipo) {
    }
}
