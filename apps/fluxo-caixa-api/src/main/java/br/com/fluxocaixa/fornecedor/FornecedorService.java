package br.com.fluxocaixa.fornecedor;

import br.com.fluxocaixa.comum.FusoHorario;

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
import java.time.temporal.ChronoUnit;

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
        String documento = normalizarDocumento(request.documento());
        validarCadastroFiscal(
                request.tipoPessoa(),
                documento,
                request.razaoSocial(),
                request.cep(),
                request.logradouro(),
                request.numero(),
                request.bairro(),
                request.municipio(),
                request.uf(),
                request.pais()
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

        if (documento != null
                && fornecedorRepository
                .existsByEmpresa_IdAndDocumentoAndExcluidoFalse(
                        empresaId,
                        documento
                )) {
            throw new IllegalArgumentException(
                    "Fornecedor ja cadastrado com este CPF/CNPJ"
            );
        }

        Fornecedor fornecedor = new Fornecedor(
                empresa,
                proximoCodigoCadastro(empresaId),
                nome,
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoOpcional(request.observacao())
        );
        aplicarCadastroProfissional(
                fornecedor,
                nome,
                request,
                documento
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
    public void verificarAcessoEmpresa(Long empresaId) {
        verificarEmpresa(empresaId);
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

    @Transactional(readOnly = true)
    public InteligenciaComprasResponse obterInteligenciaCompras(
            Long empresaId) {

        verificarEmpresa(empresaId);

        LocalDate hoje = FusoHorario.hoje();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate inicioAno = hoje.withDayOfYear(1);

        List<CompraFornecedorResponse> compras =
                listarTodasCompras(empresaId);

        List<CotacaoFornecedor> cotacoes =
                cotacaoFornecedorRepository
                        .findAllByEmpresa_IdOrderByDataCotacaoDescIdDesc(
                                empresaId
                        );

        BigDecimal gastoMes = compras
                .stream()
                .filter(compra -> !compra.data().isBefore(inicioMes))
                .map(CompraFornecedorResponse::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gastoAno = compras
                .stream()
                .filter(compra -> !compra.data().isBefore(inicioAno))
                .map(CompraFornecedorResponse::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<OportunidadeCompraResponse> oportunidades =
                calcularOportunidades(cotacoes);

        BigDecimal economiaPotencial =
                oportunidades
                        .stream()
                        .map(OportunidadeCompraResponse::economiaPotencial)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<GastoFornecedorResponse> gastosPorFornecedor =
                calcularGastosPorFornecedor(empresaId);

        List<HistoricoPrecoProdutoResponse> historicoProdutos =
                calcularHistoricoProdutos(cotacoes);

        String produtoMaiorAumento =
                historicoProdutos
                        .stream()
                        .filter(item -> item.variacaoPercentual() != null)
                        .max(
                                Comparator.comparing(
                                        HistoricoPrecoProdutoResponse
                                                ::variacaoPercentual
                                )
                        )
                        .map(HistoricoPrecoProdutoResponse::produtoNome)
                        .orElse("-");

        String melhorOportunidade =
                oportunidades
                        .stream()
                        .max(
                                Comparator.comparing(
                                        OportunidadeCompraResponse
                                                ::economiaPotencial
                                )
                        )
                        .map(
                                item -> item.produtoNome()
                                        + " em "
                                        + item.fornecedorMelhorPreco()
                        )
                        .orElse("Sem dados suficientes");

        long fornecedoresAtivos =
                fornecedorRepository
                        .findAllByEmpresa_IdAndExcluidoFalseOrderByNomeAsc(
                                empresaId
                        )
                        .stream()
                        .filter(Fornecedor::isAtivo)
                        .count();

        long cotacoesAbertas =
                cotacoes
                        .stream()
                        .filter(CotacaoFornecedor::estaComoCotacao)
                        .count();

        return new InteligenciaComprasResponse(
                gastoMes,
                gastoAno,
                economiaPotencial,
                BigDecimal.ZERO,
                fornecedoresAtivos,
                cotacoesAbertas,
                produtoMaiorAumento,
                melhorOportunidade,
                oportunidades,
                gastosPorFornecedor,
                historicoProdutos
        );
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
                                ? FusoHorario.hoje()
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

        LocalDate hoje = FusoHorario.hoje();

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
        String nome = normalizarTextoObrigatorio(request.nome());
        String documento = normalizarDocumento(request.documento());
        validarCadastroFiscal(
                request.tipoPessoa(),
                documento,
                request.razaoSocial(),
                request.cep(),
                request.logradouro(),
                request.numero(),
                request.bairro(),
                request.municipio(),
                request.uf(),
                request.pais()
        );

        if (documento != null
                && fornecedorRepository
                .existsByEmpresa_IdAndDocumentoAndIdNotAndExcluidoFalse(
                        empresaId,
                        documento,
                        fornecedorId
                )) {
            throw new IllegalArgumentException(
                    "Fornecedor ja cadastrado com este CPF/CNPJ"
            );
        }

        fornecedor.atualizar(
                nome,
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoOpcional(request.observacao())
        );
        aplicarCadastroProfissional(
                fornecedor,
                nome,
                request,
                documento
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

    private Long proximoCodigoCadastro(Long empresaId) {
        Long maiorCodigo =
                fornecedorRepository.buscarMaiorCodigoCadastroPorEmpresa(
                        empresaId
                );

        return maiorCodigo + 1;
    }

    private void validarCadastroFiscal(
            TipoPessoaFornecedor tipoPessoa,
            String documento,
            String razaoSocial,
            String cep,
            String logradouro,
            String numero,
            String bairro,
            String municipio,
            String uf,
            String pais) {

        if (tipoPessoa == null) {
            throw new IllegalArgumentException(
                    "Informe o tipo do fornecedor"
            );
        }

        if (documento == null) {
            throw new IllegalArgumentException(
                    "Informe o CPF/CNPJ do fornecedor"
            );
        }

        int tamanhoDocumento = documento.length();

        if (tipoPessoa == TipoPessoaFornecedor.FISICA
                && tamanhoDocumento != 11) {
            throw new IllegalArgumentException(
                    "CPF deve conter 11 digitos"
            );
        }

        if (tipoPessoa == TipoPessoaFornecedor.JURIDICA
                && tamanhoDocumento != 14) {
            throw new IllegalArgumentException(
                    "CNPJ deve conter 14 digitos"
            );
        }

        validarTextoObrigatorio(
                razaoSocial,
                "Informe a razao social"
        );
        validarTextoObrigatorio(cep, "Informe o CEP");
        validarTextoObrigatorio(logradouro, "Informe o endereco");
        validarTextoObrigatorio(numero, "Informe o numero");
        validarTextoObrigatorio(bairro, "Informe o bairro");
        validarTextoObrigatorio(municipio, "Informe a cidade");
        validarTextoObrigatorio(uf, "Informe a UF");
        validarTextoObrigatorio(pais, "Informe o pais");
    }

    private void validarTextoObrigatorio(
            String texto,
            String mensagem) {

        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException(mensagem);
        }
    }

    private void aplicarCadastroProfissional(
            Fornecedor fornecedor,
            String nome,
            CriarFornecedorRequest request,
            String documento) {

        fornecedor.atualizarCadastroProfissional(
                nome,
                normalizarTextoOpcional(request.nomeFantasia()),
                normalizarTextoObrigatorio(request.razaoSocial()),
                normalizarTextoOpcional(request.inscricaoMunicipal()),
                normalizarTextoOpcional(request.inscricaoEstadual()),
                normalizarTextoOpcional(request.regimeTributario()),
                request.tipoPessoa(),
                documento,
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoOpcional(request.telefoneWhatsapp()),
                normalizarTextoOpcional(request.email()),
                normalizarTextoOpcional(request.contatoComercial()),
                normalizarTextoOpcional(request.site()),
                normalizarTextoOpcional(request.observacao()),
                request.ativo() == null || request.ativo(),
                normalizarTextoObrigatorio(request.cep()),
                normalizarTextoObrigatorio(request.logradouro()),
                normalizarTextoObrigatorio(request.numero()),
                normalizarTextoOpcional(request.complemento()),
                normalizarTextoObrigatorio(request.bairro()),
                normalizarTextoObrigatorio(request.municipio()),
                normalizarUfObrigatoria(request.uf()),
                normalizarTextoObrigatorio(request.pais()),
                request.prazoMedioEntregaDias(),
                normalizarTextoOpcional(request.formasPagamento()),
                normalizarTextoOpcional(request.prazoPagamento()),
                normalizarTextoOpcional(request.condicaoFrete()),
                request.valorMinimoPedido(),
                normalizarTextoOpcional(request.observacoesComerciais())
        );
    }

    private void aplicarCadastroProfissional(
            Fornecedor fornecedor,
            String nome,
            AtualizarFornecedorRequest request,
            String documento) {

        fornecedor.atualizarCadastroProfissional(
                nome,
                normalizarTextoOpcional(request.nomeFantasia()),
                normalizarTextoObrigatorio(request.razaoSocial()),
                normalizarTextoOpcional(request.inscricaoMunicipal()),
                normalizarTextoOpcional(request.inscricaoEstadual()),
                normalizarTextoOpcional(request.regimeTributario()),
                request.tipoPessoa(),
                documento,
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoOpcional(request.telefoneWhatsapp()),
                normalizarTextoOpcional(request.email()),
                normalizarTextoOpcional(request.contatoComercial()),
                normalizarTextoOpcional(request.site()),
                normalizarTextoOpcional(request.observacao()),
                request.ativo() == null || request.ativo(),
                normalizarTextoObrigatorio(request.cep()),
                normalizarTextoObrigatorio(request.logradouro()),
                normalizarTextoObrigatorio(request.numero()),
                normalizarTextoOpcional(request.complemento()),
                normalizarTextoObrigatorio(request.bairro()),
                normalizarTextoObrigatorio(request.municipio()),
                normalizarUfObrigatoria(request.uf()),
                normalizarTextoObrigatorio(request.pais()),
                request.prazoMedioEntregaDias(),
                normalizarTextoOpcional(request.formasPagamento()),
                normalizarTextoOpcional(request.prazoPagamento()),
                normalizarTextoOpcional(request.condicaoFrete()),
                request.valorMinimoPedido(),
                normalizarTextoOpcional(request.observacoesComerciais())
        );
    }

    private List<CompraFornecedorResponse> listarTodasCompras(
            Long empresaId) {

        List<CompraFornecedorResponse> compras = new ArrayList<>();

        movimentacaoRepository
                .findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataMovimentacaoDescIdDesc(
                        empresaId
                )
                .stream()
                .map(this::criarCompraMovimentacao)
                .forEach(compras::add);

        contaFinanceiraRepository
                .findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataVencimentoDescIdDesc(
                        empresaId
                )
                .stream()
                .map(this::criarCompraConta)
                .forEach(compras::add);

        return compras;
    }

    private List<OportunidadeCompraResponse> calcularOportunidades(
            List<CotacaoFornecedor> cotacoes) {

        Map<Long, List<CotacaoFornecedor>> porProduto =
                new LinkedHashMap<>();

        cotacoes
                .stream()
                .filter(CotacaoFornecedor::estaComoCotacao)
                .forEach(
                        cotacao -> porProduto
                                .computeIfAbsent(
                                        cotacao.getProduto().getId(),
                                        chave -> new ArrayList<>()
                                )
                                .add(cotacao)
                );

        return porProduto
                .values()
                .stream()
                .filter(grupo -> grupo.size() > 1)
                .flatMap(
                        grupo -> {
                            CotacaoFornecedor melhor =
                                    grupo.stream()
                                            .filter(
                                                    cotacao ->
                                                            valorComparavel(
                                                                    cotacao
                                                            ) != null
                                            )
                                            .min(
                                                    Comparator.comparing(
                                                            this::valorComparavel
                                                    )
                                            )
                                            .orElse(null);

                            if (melhor == null) {
                                return List.<OportunidadeCompraResponse>of()
                                        .stream();
                            }

                            BigDecimal melhorValor =
                                    valorComparavel(melhor);

                            return grupo
                                    .stream()
                                    .filter(cotacao -> cotacao != melhor)
                                    .filter(
                                            cotacao ->
                                                    valorComparavel(
                                                            cotacao
                                                    ) != null
                                    )
                                    .map(
                                            cotacao -> criarOportunidade(
                                                    melhor,
                                                    melhorValor,
                                                    cotacao
                                            )
                                    );
                        }
                )
                .filter(
                        oportunidade ->
                                oportunidade.economiaPotencial()
                                        .compareTo(BigDecimal.ZERO) > 0
                )
                .sorted(
                        Comparator.comparing(
                                OportunidadeCompraResponse
                                        ::economiaPotencial
                        ).reversed()
                )
                .limit(10)
                .toList();
    }

    private OportunidadeCompraResponse criarOportunidade(
            CotacaoFornecedor melhor,
            BigDecimal melhorValor,
            CotacaoFornecedor cotacao) {

        BigDecimal valorCotacao = valorComparavel(cotacao);
        BigDecimal economia =
                valorCotacao
                        .subtract(melhorValor)
                        .multiply(cotacao.getQuantidade());
        BigDecimal percentual =
                valorCotacao.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : valorCotacao
                        .subtract(melhorValor)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(
                                valorCotacao,
                                2,
                                RoundingMode.HALF_UP
                        );

        return new OportunidadeCompraResponse(
                cotacao.getProduto().getNome(),
                cotacao.getUnidadeMedida(),
                melhor.getFornecedor().getNome(),
                melhorValor,
                cotacao.getFornecedor().getNome(),
                valorCotacao,
                economia.max(BigDecimal.ZERO).setScale(
                        2,
                        RoundingMode.HALF_UP
                ),
                percentual,
                idadePreco(cotacao.getDataCotacao())
        );
    }

    private List<GastoFornecedorResponse> calcularGastosPorFornecedor(
            Long empresaId) {

        Map<Long, GastoFornecedorAcumulado> acumulados =
                new LinkedHashMap<>();

        movimentacaoRepository
                .findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataMovimentacaoDescIdDesc(
                        empresaId
                )
                .forEach(
                        movimentacao -> acumulados
                                .computeIfAbsent(
                                        movimentacao
                                                .getFornecedor()
                                                .getId(),
                                        chave ->
                                                new GastoFornecedorAcumulado(
                                                        movimentacao
                                                                .getFornecedor()
                                                                .getId(),
                                                        movimentacao
                                                                .getFornecedorNome()
                                                )
                                )
                                .adicionar(
                                        movimentacao.getValor(),
                                        movimentacao
                                                .getDataMovimentacao()
                                )
                );

        contaFinanceiraRepository
                .findAllByEmpresa_IdAndFornecedorIsNotNullAndExcluidaFalseOrderByDataVencimentoDescIdDesc(
                        empresaId
                )
                .forEach(
                        conta -> acumulados
                                .computeIfAbsent(
                                        conta.getFornecedor().getId(),
                                        chave ->
                                                new GastoFornecedorAcumulado(
                                                        conta.getFornecedor()
                                                                .getId(),
                                                        conta.getFornecedorNome()
                                                )
                                )
                                .adicionar(
                                        conta.getValorTotal(),
                                        conta.getDataVencimento()
                                )
                );

        BigDecimal totalGeral =
                acumulados
                        .values()
                        .stream()
                        .map(GastoFornecedorAcumulado::total)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        return acumulados
                .values()
                .stream()
                .sorted(
                        Comparator.comparing(
                                GastoFornecedorAcumulado::total
                        ).reversed()
                )
                .limit(8)
                .map(acumulado -> acumulado.paraResponse(totalGeral))
                .toList();
    }

    private List<GastoFornecedorResponse> calcularGastosPorFornecedorLegado(
            List<CompraFornecedorResponse> compras) {

        BigDecimal totalGeral =
                compras
                        .stream()
                        .map(CompraFornecedorResponse::valor)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, GastoFornecedorAcumulado> acumulados =
                new LinkedHashMap<>();

        compras.forEach(
                compra -> acumulados
                        .computeIfAbsent(
                                compra.descricao() == null
                                        ? "Fornecedor"
                                        : compra.descricao(),
                                chave -> new GastoFornecedorAcumulado(
                                        compra.origemId(),
                                        compra.descricao()
                                )
                        )
                        .adicionar(
                                compra.valor(),
                                compra.data()
                        )
        );

        return acumulados
                .values()
                .stream()
                .sorted(
                        Comparator.comparing(
                                GastoFornecedorAcumulado::total
                        ).reversed()
                )
                .limit(8)
                .map(acumulado -> acumulado.paraResponse(totalGeral))
                .toList();
    }

    private List<HistoricoPrecoProdutoResponse> calcularHistoricoProdutos(
            List<CotacaoFornecedor> cotacoes) {

        Map<String, List<CotacaoFornecedor>> porProduto =
                new LinkedHashMap<>();

        cotacoes.forEach(
                cotacao -> porProduto
                        .computeIfAbsent(
                                cotacao.getProduto().getNome()
                                        + "|"
                                        + cotacao.getUnidadeMedida(),
                                chave -> new ArrayList<>()
                        )
                        .add(cotacao)
        );

        LocalDate hoje = FusoHorario.hoje();

        return porProduto
                .values()
                .stream()
                .map(
                        grupo -> criarHistoricoProduto(
                                grupo,
                                hoje
                        )
                )
                .sorted(
                        Comparator.comparing(
                                HistoricoPrecoProdutoResponse
                                        ::dataUltimoPreco,
                                Comparator.nullsLast(
                                        Comparator.reverseOrder()
                                )
                        )
                )
                .limit(12)
                .toList();
    }

    private HistoricoPrecoProdutoResponse criarHistoricoProduto(
            List<CotacaoFornecedor> grupo,
            LocalDate hoje) {

        List<CotacaoFornecedor> ordenadas =
                grupo
                        .stream()
                        .filter(cotacao -> valorComparavel(cotacao) != null)
                        .sorted(
                                Comparator
                                        .comparing(
                                                CotacaoFornecedor
                                                        ::getDataCotacao
                                        )
                                        .reversed()
                        )
                        .toList();

        if (ordenadas.isEmpty()) {
            CotacaoFornecedor referencia = grupo.get(0);
            return new HistoricoPrecoProdutoResponse(
                    referencia.getProduto().getNome(),
                    referencia.getUnidadeMedida(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "-",
                    null
            );
        }

        CotacaoFornecedor atual = ordenadas.get(0);
        BigDecimal precoAtual = valorComparavel(atual);
        BigDecimal precoAnterior =
                ordenadas.size() > 1
                        ? valorComparavel(ordenadas.get(1))
                        : null;
        BigDecimal variacao =
                precoAnterior == null
                        || precoAnterior.compareTo(BigDecimal.ZERO) == 0
                        ? null
                        : precoAtual
                        .subtract(precoAnterior)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(
                                precoAnterior,
                                2,
                                RoundingMode.HALF_UP
                        );

        BigDecimal menor =
                ordenadas
                        .stream()
                        .map(this::valorComparavel)
                        .min(Comparator.naturalOrder())
                        .orElse(null);
        BigDecimal maior =
                ordenadas
                        .stream()
                        .map(this::valorComparavel)
                        .max(Comparator.naturalOrder())
                        .orElse(null);

        String melhorFornecedor =
                ordenadas
                        .stream()
                        .min(
                                Comparator.comparing(
                                        this::valorComparavel
                                )
                        )
                        .map(item -> item.getFornecedor().getNome())
                        .orElse("-");

        return new HistoricoPrecoProdutoResponse(
                atual.getProduto().getNome(),
                atual.getUnidadeMedida(),
                precoAtual,
                precoAnterior,
                mediaDesde(
                        ordenadas,
                        hoje.minusDays(30)
                ),
                mediaDesde(
                        ordenadas,
                        hoje.minusDays(90)
                ),
                menor,
                maior,
                variacao,
                melhorFornecedor,
                atual.getDataCotacao()
        );
    }

    private BigDecimal mediaDesde(
            List<CotacaoFornecedor> cotacoes,
            LocalDate dataMinima) {

        List<BigDecimal> valores =
                cotacoes
                        .stream()
                        .filter(
                                cotacao ->
                                        !cotacao.getDataCotacao()
                                                .isBefore(dataMinima)
                        )
                        .map(this::valorComparavel)
                        .filter(valor -> valor != null)
                        .toList();

        if (valores.isEmpty()) {
            return null;
        }

        return valores
                .stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(
                        BigDecimal.valueOf(valores.size()),
                        4,
                        RoundingMode.HALF_UP
                );
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

    private String normalizarTextoOpcionalOuPadrao(
            String texto,
            String padrao) {

        String normalizado = normalizarTextoOpcional(texto);

        return normalizado == null
                ? padrao
                : normalizado;
    }

    private String normalizarDocumento(String documento) {
        if (documento == null || documento.isBlank()) {
            return null;
        }

        String normalizado = documento.replaceAll("\\D", "");

        return normalizado.isBlank()
                ? null
                : normalizado;
    }

    private String normalizarUf(String uf) {
        String normalizada = normalizarTextoOpcional(uf);

        return normalizada == null
                ? null
                : normalizada.toUpperCase();
    }

    private String normalizarUfObrigatoria(String uf) {
        return normalizarTextoObrigatorio(uf).toUpperCase();
    }

    private String idadePreco(LocalDate data) {
        if (data == null) {
            return "Sem data";
        }

        long dias = ChronoUnit.DAYS.between(
                data,
                FusoHorario.hoje()
        );

        if (dias == 0) {
            return "Registrado hoje";
        }

        return "Registrado ha " + dias + " dias";
    }

    private static final class GastoFornecedorAcumulado {

        private final Long fornecedorId;
        private final String fornecedorNome;
        private BigDecimal total = BigDecimal.ZERO;
        private long compras;
        private LocalDate ultimaCompra;

        private GastoFornecedorAcumulado(
                Long fornecedorId,
                String fornecedorNome) {

            this.fornecedorId = fornecedorId;
            this.fornecedorNome = fornecedorNome;
        }

        private void adicionar(
                BigDecimal valor,
                LocalDate data) {

            if (valor != null) {
                total = total.add(valor);
            }

            compras++;

            if (data != null
                    && (ultimaCompra == null
                    || data.isAfter(ultimaCompra))) {
                ultimaCompra = data;
            }
        }

        private BigDecimal total() {
            return total;
        }

        private GastoFornecedorResponse paraResponse(
                BigDecimal totalGeral) {

            BigDecimal participacao =
                    totalGeral == null
                            || totalGeral.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : total
                            .multiply(BigDecimal.valueOf(100))
                            .divide(
                                    totalGeral,
                                    2,
                                    RoundingMode.HALF_UP
                            );

            BigDecimal ticketMedio =
                    compras == 0
                            ? BigDecimal.ZERO
                            : total.divide(
                            BigDecimal.valueOf(compras),
                            2,
                            RoundingMode.HALF_UP
                    );

            return new GastoFornecedorResponse(
                    fornecedorId,
                    fornecedorNome,
                    total,
                    participacao,
                    compras,
                    ticketMedio,
                    ultimaCompra
            );
        }
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
