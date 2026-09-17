package br.com.fluxocaixa.fornecedor;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.contafinanceira.ContaFinanceira;
import br.com.fluxocaixa.contafinanceira.ContaFinanceiraRepository;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
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
import java.util.Objects;

@Service
public class FornecedorService {

    private final FornecedorRepository fornecedorRepository;
    private final EmpresaRepository empresaRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ContaFinanceiraRepository contaFinanceiraRepository;

    public FornecedorService(
            FornecedorRepository fornecedorRepository,
            EmpresaRepository empresaRepository,
            MovimentacaoRepository movimentacaoRepository,
            ContaFinanceiraRepository contaFinanceiraRepository) {

        this.fornecedorRepository = fornecedorRepository;
        this.empresaRepository = empresaRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.contaFinanceiraRepository = contaFinanceiraRepository;
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
