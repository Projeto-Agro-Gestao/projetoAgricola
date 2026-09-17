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
                conta.getSituacao().getDescricao()
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
}
