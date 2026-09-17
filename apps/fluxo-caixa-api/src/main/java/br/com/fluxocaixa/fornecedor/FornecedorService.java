package br.com.fluxocaixa.fornecedor;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.contafinanceira.ContaFinanceira;
import br.com.fluxocaixa.contafinanceira.ContaFinanceiraRepository;
import br.com.fluxocaixa.contafinanceira.TipoContaFinanceira;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import br.com.fluxocaixa.produto.CategoriaProduto;
import br.com.fluxocaixa.produto.CategoriaProdutoRepository;
import br.com.fluxocaixa.produto.CategoriaProdutoResponse;
import br.com.fluxocaixa.produto.CriarCategoriaProdutoRequest;
import br.com.fluxocaixa.produto.CriarProdutoRequest;
import br.com.fluxocaixa.produto.Produto;
import br.com.fluxocaixa.produto.ProdutoRepository;
import br.com.fluxocaixa.produto.ProdutoResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Comparator;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.time.LocalDate;

@Service
public class FornecedorService {

    private final FornecedorRepository fornecedorRepository;
    private final EmpresaRepository empresaRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ContaFinanceiraRepository contaFinanceiraRepository;
    private final CategoriaRepository categoriaRepository;
    private final CategoriaProdutoRepository categoriaProdutoRepository;
    private final ProdutoRepository produtoRepository;
    private final CotacaoFornecedorRepository cotacaoFornecedorRepository;

    public FornecedorService(
            FornecedorRepository fornecedorRepository,
            EmpresaRepository empresaRepository,
            MovimentacaoRepository movimentacaoRepository,
            ContaFinanceiraRepository contaFinanceiraRepository,
            CategoriaRepository categoriaRepository,
            CategoriaProdutoRepository categoriaProdutoRepository,
            ProdutoRepository produtoRepository,
            CotacaoFornecedorRepository cotacaoFornecedorRepository) {

        this.fornecedorRepository = fornecedorRepository;
        this.empresaRepository = empresaRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.contaFinanceiraRepository = contaFinanceiraRepository;
        this.categoriaRepository = categoriaRepository;
        this.categoriaProdutoRepository = categoriaProdutoRepository;
        this.produtoRepository = produtoRepository;
        this.cotacaoFornecedorRepository = cotacaoFornecedorRepository;
    }

    @Transactional
    public FornecedorResponse criar(
            Long empresaId,
            CriarFornecedorRequest request) {

        Empresa empresa = buscarEmpresa(empresaId);
        String nome = normalizarTextoObrigatorio(
                request.nome()
        );

        if (
                fornecedorRepository
                        .existsByEmpresa_IdAndNomeIgnoreCaseAndExcluidoFalse(
                                empresaId,
                                nome
                        )
        ) {
            throw new IllegalArgumentException(
                    "Ja existe um fornecedor ativo com este nome"
            );
        }

        Fornecedor fornecedor = new Fornecedor(
                empresa,
                nome,
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoOpcional(request.observacao())
        );

        return FornecedorResponse.de(
                fornecedorRepository.save(fornecedor)
        );
    }

    @Transactional(readOnly = true)
    public List<FornecedorResponse> listar(
            Long empresaId) {

        verificarEmpresa(empresaId);

        return fornecedorRepository
                .findAllByEmpresa_IdAndExcluidoFalseOrderByNomeAsc(
                        empresaId
                )
                .stream()
                .map(FornecedorResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FornecedorResponse> listarLixeira(
            Long empresaId) {

        verificarEmpresa(empresaId);

        return fornecedorRepository
                .findAllByEmpresa_IdAndExcluidoTrueOrderByExcluidoEmDescIdDesc(
                        empresaId
                )
                .stream()
                .map(FornecedorResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CompraFornecedorResponse> listarCompras(
            Long empresaId,
            Long fornecedorId) {

        buscarFornecedorAtivo(
                empresaId,
                fornecedorId
        );

        List<CompraFornecedorResponse> compras =
                new ArrayList<>();

        movimentacaoRepository
                .findAllByEmpresa_IdAndFornecedor_IdAndExcluidaFalseOrderByDataMovimentacaoDescIdDesc(
                        empresaId,
                        fornecedorId
                )
                .stream()
                .map(this::criarCompraMovimentacao)
                .forEach(compras::add);

        contaFinanceiraRepository
                .findAllByEmpresa_IdAndFornecedor_IdAndExcluidaFalseOrderByDataVencimentoDescIdDesc(
                        empresaId,
                        fornecedorId
                )
                .stream()
                .map(this::criarCompraConta)
                .forEach(compras::add);

        return compras
                .stream()
                .sorted(
                        Comparator
                                .comparing(
                                        CompraFornecedorResponse::data
                                )
                                .reversed()
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComparativoProdutoFornecedorResponse> compararProdutos(
            Long empresaId) {

        verificarEmpresa(empresaId);

        Map<String, ComparativoProduto> comparativos =
                new LinkedHashMap<>();

        movimentacaoRepository
                .findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataMovimentacaoDescIdDesc(
                        empresaId
                )
                .forEach(
                        movimentacao ->
                                acumularComparativo(
                                        comparativos,
                                        movimentacao.getProdutoNome(),
                                        movimentacao.getProdutoClassificacao(),
                                        movimentacao.getUnidadeMedida(),
                                        movimentacao.getFornecedorNome(),
                                        movimentacao.getValor(),
                                        movimentacao.getQuantidade(),
                                        movimentacao.getValorUnitario()
                                )
                );

        contaFinanceiraRepository
                .findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataVencimentoDescIdDesc(
                        empresaId
                )
                .forEach(
                        conta ->
                                acumularComparativo(
                                        comparativos,
                                        conta.getProdutoNome(),
                                        conta.getProdutoClassificacao(),
                                        conta.getUnidadeMedida(),
                                        conta.getFornecedorNome(),
                                        conta.getValorTotal(),
                                        conta.getQuantidade(),
                                        conta.getValorUnitario()
                                )
                );

        return comparativos
                .values()
                .stream()
                .filter(ComparativoProduto::possuiPrecoUnitario)
                .sorted(
                        Comparator
                                .comparing(
                                        ComparativoProduto::produtoNome,
                                        String.CASE_INSENSITIVE_ORDER
                                )
                                .thenComparing(
                                        ComparativoProduto::mediaValorUnitario
                                )
                )
                .map(ComparativoProduto::paraResponse)
                .toList();
    }

    @Transactional
    public CategoriaProdutoResponse criarCategoriaProduto(
            Long empresaId,
            CriarCategoriaProdutoRequest request) {

        Empresa empresa = buscarEmpresa(empresaId);
        String nome = normalizarTextoObrigatorio(request.nome());

        CategoriaProduto categoria =
                categoriaProdutoRepository
                        .findByEmpresa_IdAndNomeIgnoreCase(
                                empresaId,
                                nome
                        )
                        .map(categoriaExistente -> {
                            categoriaExistente.ativar();
                            return categoriaExistente;
                        })
                        .orElseGet(
                                () -> new CategoriaProduto(
                                        empresa,
                                        nome
                                )
                        );

        return CategoriaProdutoResponse.de(
                categoriaProdutoRepository.saveAndFlush(
                        categoria
                )
        );
    }

    @Transactional(readOnly = true)
    public List<CategoriaProdutoResponse> listarCategoriasProduto(
            Long empresaId) {

        verificarEmpresa(empresaId);

        return categoriaProdutoRepository
                .findAllByEmpresa_IdAndAtivoTrueOrderByNomeAsc(
                        empresaId
                )
                .stream()
                .map(CategoriaProdutoResponse::de)
                .toList();
    }

    @Transactional
    public ProdutoResponse criarProduto(
            Long empresaId,
            CriarProdutoRequest request) {

        Empresa empresa = buscarEmpresa(empresaId);
        CategoriaProduto categoria =
                buscarCategoriaProduto(
                        empresaId,
                        request.categoriaProdutoId()
                );

        String nome = normalizarTextoObrigatorio(request.nome());
        String unidadeBase =
                normalizarTextoObrigatorio(request.unidadeBase());

        Produto produto =
                produtoRepository
                        .findByEmpresa_IdAndCategoria_IdAndNomeIgnoreCase(
                                empresaId,
                                categoria.getId(),
                                nome
                        )
                        .map(produtoExistente -> {
                            produtoExistente.atualizar(
                                    categoria,
                                    nome,
                                    unidadeBase,
                                    request.pesoPadraoKg()
                            );
                            produtoExistente.ativar();
                            return produtoExistente;
                        })
                        .orElseGet(
                                () -> new Produto(
                                        empresa,
                                        categoria,
                                        nome,
                                        unidadeBase,
                                        request.pesoPadraoKg()
                                )
                        );

        return ProdutoResponse.de(
                produtoRepository.saveAndFlush(
                        produto
                )
        );
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listarProdutos(
            Long empresaId,
            Long categoriaProdutoId) {

        verificarEmpresa(empresaId);

        if (categoriaProdutoId != null) {
            buscarCategoriaProduto(
                    empresaId,
                    categoriaProdutoId
            );

            return produtoRepository
                    .findAllByEmpresa_IdAndCategoria_IdAndAtivoTrueOrderByNomeAsc(
                            empresaId,
                            categoriaProdutoId
                    )
                    .stream()
                    .map(ProdutoResponse::de)
                    .toList();
        }

        return produtoRepository
                .findAllByEmpresa_IdAndAtivoTrueOrderByNomeAsc(
                        empresaId
                )
                .stream()
                .map(ProdutoResponse::de)
                .toList();
    }

    @Transactional
    public CotacaoFornecedorResponse criarCotacao(
            Long empresaId,
            CriarCotacaoFornecedorRequest request) {

        Empresa empresa = buscarEmpresa(empresaId);
        Fornecedor fornecedor =
                buscarFornecedorAtivo(
                        empresaId,
                        request.fornecedorId()
                );
        Produto produto =
                buscarProdutoAtivo(
                        empresaId,
                        request.produtoId()
                );

        CotacaoFornecedor cotacao =
                new CotacaoFornecedor(
                        empresa,
                        fornecedor,
                        produto,
                        normalizarTextoOpcional(
                                request.compradorNome()
                        ),
                        request.dataCotacao(),
                        request.quantidade(),
                        normalizarTextoObrigatorio(
                                request.unidadeMedida()
                        ),
                        request.pesoTotalKg(),
                        request.valorTotal(),
                        request.frete(),
                        request.desconto(),
                        normalizarTextoOpcional(
                                request.observacao()
                        )
                );

        return CotacaoFornecedorResponse.de(
                cotacaoFornecedorRepository.save(
                        cotacao
                )
        );
    }

    @Transactional(readOnly = true)
    public List<CotacaoFornecedorResponse> listarCotacoes(
            Long empresaId) {

        verificarEmpresa(empresaId);

        return cotacaoFornecedorRepository
                .findAllByEmpresa_IdOrderByDataCotacaoDescIdDesc(
                        empresaId
                )
                .stream()
                .map(CotacaoFornecedorResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CotacaoFornecedorResponse> listarCotacoesPorFornecedor(
            Long empresaId,
            Long fornecedorId) {

        buscarFornecedorAtivo(
                empresaId,
                fornecedorId
        );

        return cotacaoFornecedorRepository
                .findAllByEmpresa_IdAndFornecedor_IdOrderByDataCotacaoDescIdDesc(
                        empresaId,
                        fornecedorId
                )
                .stream()
                .map(CotacaoFornecedorResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComparativoCotacaoFornecedorResponse> compararCotacoes(
            Long empresaId) {

        verificarEmpresa(empresaId);

        List<CotacaoFornecedor> cotacoes =
                cotacaoFornecedorRepository
                        .findAllByEmpresa_IdOrderByDataCotacaoDescIdDesc(
                                empresaId
                        )
                        .stream()
                        .filter(CotacaoFornecedor::estaComoCotacao)
                        .toList();

        Map<Long, BigDecimal> melhoresPorProduto =
                new LinkedHashMap<>();

        cotacoes.forEach(
                cotacao -> {
                    BigDecimal valorComparavel =
                            valorComparavel(cotacao);

                    if (valorComparavel != null) {
                        melhoresPorProduto.merge(
                                cotacao.getProduto().getId(),
                                valorComparavel,
                                (atual, novo) ->
                                        novo.compareTo(atual) < 0
                                                ? novo
                                                : atual
                        );
                    }
                }
        );

        return cotacoes
                .stream()
                .filter(
                        cotacao -> valorComparavel(cotacao) != null
                )
                .map(
                        cotacao -> {
                            BigDecimal valorComparavel =
                                    valorComparavel(cotacao);

                            return new ComparativoCotacaoFornecedorResponse(
                                    cotacao.getProduto().getId(),
                                    cotacao.getProduto().getNome(),
                                    cotacao.getProduto().getCategoria().getNome(),
                                    cotacao.getFornecedor().getNome(),
                                    cotacao.getValorPorKg(),
                                    cotacao.getValorPorUnidade(),
                                    cotacao.getValorPorLote(),
                                    cotacao.getValorLiquido(),
                                    1,
                                    valorComparavel.compareTo(
                                            melhoresPorProduto.get(
                                                    cotacao.getProduto().getId()
                                            )
                                    ) == 0
                            );
                        }
                )
                .sorted(
                        Comparator
                                .comparing(
                                        ComparativoCotacaoFornecedorResponse
                                                ::produtoNome,
                                        String.CASE_INSENSITIVE_ORDER
                                )
                                .thenComparing(
                                        ComparativoCotacaoFornecedorResponse
                                                ::melhorValorPorKg,
                                        Comparator.nullsLast(
                                                Comparator.naturalOrder()
                                        )
                                )
                )
                .toList();
    }

    @Transactional
    public CotacaoFornecedorResponse enviarCotacaoAoFinanceiro(
            Long empresaId,
            Long cotacaoId,
            EnviarCotacaoAoFinanceiroRequest request) {

        CotacaoFornecedor cotacao =
                buscarCotacaoAberta(
                        empresaId,
                        cotacaoId
                );

        Categoria categoria =
                buscarOuCriarCategoriaFinanceira(
                        empresaId,
                        cotacao.getEmpresa(),
                        request.categoriaId(),
                        request.novaCategoriaNome(),
                        TipoMovimentacao.DESPESA
                );

        Movimentacao movimentacao =
                new Movimentacao(
                        cotacao.getEmpresa(),
                        categoria,
                        criarDescricaoCotacao(cotacao),
                        cotacao.getValorLiquido(),
                        TipoMovimentacao.DESPESA,
                        request.dataMovimentacao() == null
                                ? LocalDate.now()
                                : request.dataMovimentacao(),
                        criarObservacaoCotacao(
                                cotacao,
                                request.observacao()
                        ),
                        cotacao.getFornecedor(),
                        cotacao.getCompradorNome(),
                        cotacao.getProduto(),
                        cotacao.getProduto().getNome(),
                        cotacao.getProduto().getCategoria().getNome(),
                        cotacao.getQuantidade(),
                        cotacao.getUnidadeMedida()
                );

        Movimentacao movimentacaoSalva =
                movimentacaoRepository.save(
                        movimentacao
                );

        cotacao.marcarEnviadaAoFinanceiro(
                movimentacaoSalva
        );

        return CotacaoFornecedorResponse.de(
                cotacaoFornecedorRepository.saveAndFlush(
                        cotacao
                )
        );
    }

    @Transactional
    public CotacaoFornecedorResponse enviarCotacaoAsContas(
            Long empresaId,
            Long cotacaoId,
            EnviarCotacaoAsContasRequest request) {

        CotacaoFornecedor cotacao =
                buscarCotacaoAberta(
                        empresaId,
                        cotacaoId
                );

        Categoria categoria =
                buscarOuCriarCategoriaFinanceira(
                        empresaId,
                        cotacao.getEmpresa(),
                        request.categoriaId(),
                        request.novaCategoriaNome(),
                        TipoMovimentacao.DESPESA
                );

        LocalDate hoje = LocalDate.now();

        ContaFinanceira conta =
                new ContaFinanceira(
                        cotacao.getEmpresa(),
                        categoria,
                        criarDescricaoCotacao(cotacao),
                        cotacao.getFornecedor().getNome(),
                        normalizarTextoOpcional(
                                request.numeroDocumento()
                        ),
                        TipoContaFinanceira.PAGAR,
                        cotacao.getValorLiquido(),
                        hoje,
                        request.dataVencimento() == null
                                ? hoje
                                : request.dataVencimento(),
                        criarObservacaoCotacao(
                                cotacao,
                                request.observacao()
                        ),
                        cotacao.getFornecedor(),
                        cotacao.getCompradorNome(),
                        cotacao.getProduto(),
                        cotacao.getProduto().getNome(),
                        cotacao.getProduto().getCategoria().getNome(),
                        cotacao.getQuantidade(),
                        cotacao.getUnidadeMedida()
                );

        ContaFinanceira contaSalva =
                contaFinanceiraRepository.save(
                        conta
                );

        cotacao.marcarEnviadaAsContas(
                contaSalva
        );

        return CotacaoFornecedorResponse.de(
                cotacaoFornecedorRepository.saveAndFlush(
                        cotacao
                )
        );
    }

    @Transactional
    public FornecedorResponse atualizar(
            Long empresaId,
            Long fornecedorId,
            AtualizarFornecedorRequest request) {

        Fornecedor fornecedor =
                buscarFornecedorAtivo(
                        empresaId,
                        fornecedorId
                );

        fornecedor.atualizar(
                normalizarTextoObrigatorio(request.nome()),
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoOpcional(request.observacao())
        );

        return FornecedorResponse.de(
                fornecedorRepository.saveAndFlush(
                        fornecedor
                )
        );
    }

    @Transactional
    public FornecedorResponse moverParaLixeira(
            Long empresaId,
            Long fornecedorId) {

        Fornecedor fornecedor =
                buscarFornecedorAtivo(
                        empresaId,
                        fornecedorId
                );

        fornecedor.moverParaLixeira();

        return FornecedorResponse.de(
                fornecedorRepository.saveAndFlush(
                        fornecedor
                )
        );
    }

    @Transactional
    public FornecedorResponse restaurar(
            Long empresaId,
            Long fornecedorId) {

        Fornecedor fornecedor =
                buscarFornecedorExcluido(
                        empresaId,
                        fornecedorId
                );

        fornecedor.restaurar();

        return FornecedorResponse.de(
                fornecedorRepository.saveAndFlush(
                        fornecedor
                )
        );
    }

    @Transactional
    public void excluirPermanentemente(
            Long empresaId,
            Long fornecedorId) {

        Fornecedor fornecedor =
                buscarFornecedorExcluido(
                        empresaId,
                        fornecedorId
                );

        boolean possuiMovimentacoes =
                movimentacaoRepository
                        .existsByEmpresa_IdAndFornecedor_Id(
                                empresaId,
                                fornecedorId
                        );

        boolean possuiContas =
                contaFinanceiraRepository
                        .existsByEmpresa_IdAndFornecedor_Id(
                                empresaId,
                                fornecedorId
                        );

        if (possuiMovimentacoes || possuiContas) {
            throw new FornecedorComComprasException(
                    fornecedor.getNome()
            );
        }

        fornecedorRepository.delete(
                fornecedor
        );
    }

    public Fornecedor buscarFornecedorAtivo(
            Long empresaId,
            Long fornecedorId) {

        return fornecedorRepository
                .findByIdAndEmpresa_IdAndExcluidoFalse(
                        fornecedorId,
                        empresaId
                )
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Fornecedor nao encontrado"
                        )
                );
    }

    private Fornecedor buscarFornecedorExcluido(
            Long empresaId,
            Long fornecedorId) {

        return fornecedorRepository
                .findByIdAndEmpresa_IdAndExcluidoTrue(
                        fornecedorId,
                        empresaId
                )
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Fornecedor nao encontrado"
                        )
                );
    }

    private Empresa buscarEmpresa(Long empresaId) {
        return empresaRepository
                .findById(empresaId)
                .orElseThrow(
                        () -> new EmpresaNaoEncontradaException(
                                empresaId
                        )
                );
    }

    private CompraFornecedorResponse criarCompraMovimentacao(
            Movimentacao movimentacao) {

        return new CompraFornecedorResponse(
                "Movimentacao financeira",
                movimentacao.getId(),
                movimentacao.getDataMovimentacao(),
                movimentacao.getDescricao(),
                movimentacao.getValor(),
                movimentacao.getCategoria() == null
                        ? movimentacao.getCategoriaOriginalNome()
                        : movimentacao.getCategoria().getNome(),
                movimentacao.getCompradorNome(),
                movimentacao.getProdutoNome(),
                movimentacao.getProdutoClassificacao(),
                movimentacao.getQuantidade(),
                movimentacao.getUnidadeMedida(),
                movimentacao.getValorUnitario(),
                movimentacao.getTipo().getDescricao()
        );
    }

    private CompraFornecedorResponse criarCompraConta(
            ContaFinanceira conta) {

        return new CompraFornecedorResponse(
                "Conta a pagar",
                conta.getId(),
                conta.getDataVencimento(),
                conta.getDescricao(),
                conta.getValorTotal(),
                conta.getCategoria() == null
                        ? conta.getCategoriaOriginalNome()
                        : conta.getCategoria().getNome(),
                conta.getCompradorNome(),
                conta.getProdutoNome(),
                conta.getProdutoClassificacao(),
                conta.getQuantidade(),
                conta.getUnidadeMedida(),
                conta.getValorUnitario(),
                conta.getSituacao().getDescricao()
        );
    }

    private CategoriaProduto buscarCategoriaProduto(
            Long empresaId,
            Long categoriaProdutoId) {

        return categoriaProdutoRepository
                .findByIdAndEmpresa_Id(
                        categoriaProdutoId,
                        empresaId
                )
                .filter(CategoriaProduto::isAtivo)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Categoria de produto nao encontrada"
                        )
                );
    }

    private Produto buscarProdutoAtivo(
            Long empresaId,
            Long produtoId) {

        return produtoRepository
                .findByIdAndEmpresa_Id(
                        produtoId,
                        empresaId
                )
                .filter(Produto::isAtivo)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Produto nao encontrado"
                        )
                );
    }

    private CotacaoFornecedor buscarCotacaoAberta(
            Long empresaId,
            Long cotacaoId) {

        CotacaoFornecedor cotacao =
                cotacaoFornecedorRepository
                        .findByIdAndEmpresa_Id(
                                cotacaoId,
                                empresaId
                        )
                        .orElseThrow(
                                () -> new EntityNotFoundException(
                                        "Cotacao nao encontrada"
                                )
                        );

        if (!cotacao.estaComoCotacao()) {
            throw new IllegalStateException(
                    "Esta cotacao ja foi enviada para outra area"
            );
        }

        return cotacao;
    }

    private Categoria buscarOuCriarCategoriaFinanceira(
            Long empresaId,
            Empresa empresa,
            Long categoriaId,
            String novaCategoriaNome,
            TipoMovimentacao tipo) {

        if (categoriaId != null) {
            Categoria categoria =
                    categoriaRepository
                            .findByIdAndEmpresa_Id(
                                    categoriaId,
                                    empresaId
                            )
                            .filter(Categoria::isAtivo)
                            .orElseThrow(
                                    () -> new EntityNotFoundException(
                                            "Categoria financeira nao encontrada"
                                    )
                            );

            if (categoria.getTipo() != tipo) {
                throw new IllegalArgumentException(
                        "Escolha uma categoria de despesa para esta compra"
                );
            }

            return categoria;
        }

        if (novaCategoriaNome == null
                || novaCategoriaNome.isBlank()) {
            throw new IllegalArgumentException(
                    "Escolha uma categoria existente ou informe uma nova categoria"
            );
        }

        String nome =
                normalizarTextoObrigatorio(novaCategoriaNome);

        return categoriaRepository
                .findByEmpresa_IdAndNomeIgnoreCaseAndTipo(
                        empresaId,
                        nome,
                        tipo
                )
                .orElseGet(
                        () -> categoriaRepository.save(
                                new Categoria(
                                        empresa,
                                        nome,
                                        tipo
                                )
                        )
                );
    }

    private BigDecimal valorComparavel(
            CotacaoFornecedor cotacao) {

        if (cotacao.getValorPorKg() != null) {
            return cotacao.getValorPorKg();
        }

        if (cotacao.getValorPorUnidade() != null) {
            return cotacao.getValorPorUnidade();
        }

        return cotacao.getValorPorLote();
    }

    private String criarDescricaoCotacao(
            CotacaoFornecedor cotacao) {

        String descricao =
                "Compra: "
                        + cotacao.getProduto().getNome()
                        + " - "
                        + cotacao.getFornecedor().getNome();

        if (descricao.length() > 150) {
            return descricao.substring(0, 150);
        }

        return descricao;
    }

    private String criarObservacaoCotacao(
            CotacaoFornecedor cotacao,
            String observacaoInformada) {

        String texto =
                "Gerada pela cotacao de fornecedor "
                        + cotacao.getId()
                        + ". Produto: "
                        + cotacao.getProduto().getNome()
                        + ". Valor por kg: "
                        + textoOuTraco(cotacao.getValorPorKg())
                        + ". Valor por unidade: "
                        + textoOuTraco(cotacao.getValorPorUnidade())
                        + ".";

        String observacao =
                normalizarTextoOpcional(observacaoInformada);

        if (observacao != null) {
            texto = texto + " " + observacao;
        }

        if (texto.length() > 500) {
            return texto.substring(0, 500);
        }

        return texto;
    }

    private String textoOuTraco(BigDecimal valor) {
        return valor == null
                ? "-"
                : valor.setScale(
                        4,
                        RoundingMode.HALF_UP
                ).toPlainString();
    }

    private void acumularComparativo(
            Map<String, ComparativoProduto> comparativos,
            String produtoNome,
            String produtoClassificacao,
            String unidadeMedida,
            String fornecedorNome,
            BigDecimal valor,
            BigDecimal quantidade,
            BigDecimal valorUnitario) {

        if (
                produtoNome == null
                        || produtoNome.isBlank()
                        || fornecedorNome == null
                        || fornecedorNome.isBlank()
        ) {
            return;
        }

        String unidadeNormalizada =
                unidadeMedida == null || unidadeMedida.isBlank()
                        ? "unidade"
                        : unidadeMedida;

        String chave =
                produtoNome.toLowerCase()
                        + "|"
                        + unidadeNormalizada.toLowerCase()
                        + "|"
                        + fornecedorNome.toLowerCase();

        ComparativoProduto comparativo =
                comparativos.computeIfAbsent(
                        chave,
                        chaveIgnorada ->
                                new ComparativoProduto(
                                        produtoNome,
                                        produtoClassificacao,
                                        unidadeNormalizada,
                                        fornecedorNome
                                )
                );

        comparativo.adicionar(
                valor,
                quantidade,
                valorUnitario
        );
    }

    private void verificarEmpresa(Long empresaId) {
        if (!empresaRepository.existsById(empresaId)) {
            throw new EmpresaNaoEncontradaException(
                    empresaId
            );
        }
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

    private static final class ComparativoProduto {

        private final String produtoNome;
        private final String produtoClassificacao;
        private final String unidadeMedida;
        private final String fornecedorNome;
        private BigDecimal menorValorUnitario;
        private BigDecimal maiorValorUnitario;
        private BigDecimal somaValorUnitario = BigDecimal.ZERO;
        private BigDecimal totalComprado = BigDecimal.ZERO;
        private BigDecimal quantidadeTotal = BigDecimal.ZERO;
        private long quantidadeRegistros;

        private ComparativoProduto(
                String produtoNome,
                String produtoClassificacao,
                String unidadeMedida,
                String fornecedorNome) {

            this.produtoNome = produtoNome;
            this.produtoClassificacao = produtoClassificacao;
            this.unidadeMedida = unidadeMedida;
            this.fornecedorNome = fornecedorNome;
        }

        private void adicionar(
                BigDecimal valor,
                BigDecimal quantidade,
                BigDecimal valorUnitario) {

            if (valor != null) {
                totalComprado =
                        totalComprado.add(valor);
            }

            if (quantidade != null) {
                quantidadeTotal =
                        quantidadeTotal.add(quantidade);
            }

            if (valorUnitario == null) {
                return;
            }

            menorValorUnitario =
                    menorValorUnitario == null
                            || valorUnitario.compareTo(
                            menorValorUnitario
                    ) < 0
                            ? valorUnitario
                            : menorValorUnitario;

            maiorValorUnitario =
                    maiorValorUnitario == null
                            || valorUnitario.compareTo(
                            maiorValorUnitario
                    ) > 0
                            ? valorUnitario
                            : maiorValorUnitario;

            somaValorUnitario =
                    somaValorUnitario.add(valorUnitario);

            quantidadeRegistros++;
        }

        private boolean possuiPrecoUnitario() {
            return quantidadeRegistros > 0;
        }

        private String produtoNome() {
            return produtoNome;
        }

        private BigDecimal mediaValorUnitario() {
            if (quantidadeRegistros == 0) {
                return BigDecimal.ZERO;
            }

            return somaValorUnitario.divide(
                    BigDecimal.valueOf(quantidadeRegistros),
                    4,
                    RoundingMode.HALF_UP
            );
        }

        private ComparativoProdutoFornecedorResponse paraResponse() {
            return new ComparativoProdutoFornecedorResponse(
                    produtoNome,
                    produtoClassificacao,
                    unidadeMedida,
                    fornecedorNome,
                    menorValorUnitario,
                    maiorValorUnitario,
                    mediaValorUnitario(),
                    totalComprado,
                    quantidadeTotal,
                    quantidadeRegistros
            );
        }
    }
}
