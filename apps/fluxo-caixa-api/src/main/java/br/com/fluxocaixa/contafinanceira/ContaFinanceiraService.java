package br.com.fluxocaixa.contafinanceira;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaNaoEncontradaException;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ContaFinanceiraService {

    private static final int
            ANTECEDENCIA_PADRAO_LEMBRETE = 2;

    private final ContaFinanceiraRepository
            contaFinanceiraRepository;

    private final LiquidacaoContaRepository
            liquidacaoContaRepository;

    private final EmpresaRepository
            empresaRepository;

    private final CategoriaRepository
            categoriaRepository;

    private final MovimentacaoRepository
            movimentacaoRepository;

    public ContaFinanceiraService(
            ContaFinanceiraRepository
                    contaFinanceiraRepository,
            LiquidacaoContaRepository
                    liquidacaoContaRepository,
            EmpresaRepository empresaRepository,
            CategoriaRepository categoriaRepository,
            MovimentacaoRepository
                    movimentacaoRepository) {

        this.contaFinanceiraRepository =
                contaFinanceiraRepository;

        this.liquidacaoContaRepository =
                liquidacaoContaRepository;

        this.empresaRepository =
                empresaRepository;

        this.categoriaRepository =
                categoriaRepository;

        this.movimentacaoRepository =
                movimentacaoRepository;
    }

    @Transactional
    public ContaFinanceiraResponse criar(
            Long empresaId,
            CriarContaFinanceiraRequest request) {

        Empresa empresa =
                buscarEmpresa(empresaId);

        Categoria categoria =
                buscarCategoria(
                        empresaId,
                        request.categoriaId()
                );

        validarDatas(
                request.dataEmissao(),
                request.dataVencimento()
        );

        validarCategoriaCompativel(
                categoria,
                request.tipo()
        );

        String descricao =
                normalizarTextoObrigatorio(
                        request.descricao()
                );

        String favorecido =
                normalizarTextoOpcional(
                        request.favorecido()
                );

        String numeroDocumento =
                normalizarTextoOpcional(
                        request.numeroDocumento()
                );

        String observacao =
                normalizarTextoOpcional(
                        request.observacao()
                );

        ContaFinanceira conta =
                new ContaFinanceira(
                        empresa,
                        categoria,
                        descricao,
                        favorecido,
                        numeroDocumento,
                        request.tipo(),
                        request.valorTotal(),
                        request.dataEmissao(),
                        request.dataVencimento(),
                        observacao
                );

        configurarLembreteInicial(
                conta,
                request.lembreteAtivo(),
                request.antecedenciaLembreteDias()
        );

        ContaFinanceira contaSalva =
                contaFinanceiraRepository.save(
                        conta
                );

        return ContaFinanceiraResponse.de(
                contaSalva
        );
    }

    @Transactional(readOnly = true)
    public List<ContaFinanceiraResponse> listar(
            Long empresaId,
            TipoContaFinanceira tipo,
            SituacaoContaFinanceira situacao) {

        buscarEmpresa(empresaId);

        return contaFinanceiraRepository
                .findAllByEmpresa_IdOrderByDataVencimentoAsc(
                        empresaId
                )
                .stream()
                .filter(
                        conta ->
                                tipo == null
                                        || conta.getTipo()
                                        == tipo
                )
                .filter(
                        conta ->
                                situacao == null
                                        || conta.getSituacao()
                                        == situacao
                )
                .map(ContaFinanceiraResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContaFinanceiraResponse buscarPorId(
            Long empresaId,
            Long contaId) {

        ContaFinanceira conta =
                buscarConta(
                        empresaId,
                        contaId
                );

        return ContaFinanceiraResponse.de(
                conta
        );
    }

    @Transactional
    public ContaFinanceiraResponse atualizar(
            Long empresaId,
            Long contaId,
            AtualizarContaFinanceiraRequest request) {

        ContaFinanceira conta =
                buscarConta(
                        empresaId,
                        contaId
                );

        Categoria categoria =
                buscarCategoria(
                        empresaId,
                        request.categoriaId()
                );

        validarDatas(
                request.dataEmissao(),
                request.dataVencimento()
        );

        validarCategoriaCompativel(
                categoria,
                conta.getTipo()
        );

        try {
            conta.alterarDados(
                    categoria,

                    normalizarTextoObrigatorio(
                            request.descricao()
                    ),

                    normalizarTextoOpcional(
                            request.favorecido()
                    ),

                    normalizarTextoOpcional(
                            request.numeroDocumento()
                    ),

                    request.valorTotal(),
                    request.dataEmissao(),
                    request.dataVencimento(),

                    normalizarTextoOpcional(
                            request.observacao()
                    )
            );
        } catch (
                IllegalArgumentException
                | IllegalStateException exception
        ) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    exception.getMessage()
            );
        }

        ContaFinanceira contaSalva =
                contaFinanceiraRepository
                        .saveAndFlush(conta);

        return ContaFinanceiraResponse.de(
                contaSalva
        );
    }

    @Transactional
    public ContaFinanceiraResponse
    configurarLembrete(
            Long empresaId,
            Long contaId,
            ConfigurarLembreteContaRequest request) {

        ContaFinanceira conta =
                buscarConta(
                        empresaId,
                        contaId
                );

        try {
            if (Boolean.TRUE.equals(
                    request.ativo()
            )) {
                int antecedencia =
                        request.antecedenciaDias()
                                == null
                                ? ANTECEDENCIA_PADRAO_LEMBRETE
                                : request.antecedenciaDias();

                conta.ativarLembrete(
                        antecedencia
                );
            } else {
                conta.desativarLembrete();
            }
        } catch (
                IllegalArgumentException
                | IllegalStateException exception
        ) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    exception.getMessage()
            );
        }

        ContaFinanceira contaSalva =
                contaFinanceiraRepository
                        .saveAndFlush(conta);

        return ContaFinanceiraResponse.de(
                contaSalva
        );
    }

    @Transactional
    public ContaFinanceiraResponse cancelar(
            Long empresaId,
            Long contaId) {

        ContaFinanceira conta =
                buscarConta(
                        empresaId,
                        contaId
                );

        try {
            conta.cancelar();
        } catch (
                IllegalArgumentException
                | IllegalStateException exception
        ) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    exception.getMessage()
            );
        }

        ContaFinanceira contaSalva =
                contaFinanceiraRepository
                        .saveAndFlush(conta);

        return ContaFinanceiraResponse.de(
                contaSalva
        );
    }

    @Transactional
    public LiquidacaoContaResponse liquidar(
            Long empresaId,
            Long contaId,
            LiquidarContaFinanceiraRequest request) {

        ContaFinanceira conta =
                buscarConta(
                        empresaId,
                        contaId
                );

        if (
                request.dataLiquidacao()
                        .isAfter(LocalDate.now())
        ) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    "A data do pagamento ou recebimento "
                            + "não pode estar no futuro"
            );
        }

        boolean lancarNoControleFinanceiro =
                Boolean.TRUE.equals(
                        request
                                .lancarNoControleFinanceiro()
                );

        Categoria categoriaMovimentacao = null;

        if (lancarNoControleFinanceiro) {
            if (request.categoriaId() == null) {
                throw new
                        OperacaoContaFinanceiraInvalidaException(
                        "Escolha uma categoria para lançar "
                                + "no Controle financeiro"
                );
            }

            categoriaMovimentacao =
                    buscarCategoria(
                            empresaId,
                            request.categoriaId()
                    );

            validarCategoriaCompativel(
                    categoriaMovimentacao,
                    conta.getTipo()
            );
        } else if (request.categoriaId() != null) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    "A categoria somente deve ser informada "
                            + "quando a baixa for lançada no "
                            + "Controle financeiro"
            );
        }

        try {
            conta.registrarLiquidacao(
                    request.valor(),
                    request.dataLiquidacao()
            );
        } catch (
                IllegalArgumentException
                | IllegalStateException exception
        ) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    exception.getMessage()
            );
        }

        Movimentacao movimentacaoSalva = null;

        if (lancarNoControleFinanceiro) {
            TipoMovimentacao tipoMovimentacao =
                    converterParaTipoMovimentacao(
                            conta.getTipo()
                    );

            String descricaoMovimentacao =
                    criarDescricaoMovimentacao(
                            conta
                    );

            String observacaoMovimentacao =
                    criarObservacaoMovimentacao(
                            conta,
                            request.observacao()
                    );

            Movimentacao movimentacao =
                    new Movimentacao(
                            conta.getEmpresa(),
                            categoriaMovimentacao,
                            descricaoMovimentacao,
                            request.valor(),
                            tipoMovimentacao,
                            request.dataLiquidacao(),
                            observacaoMovimentacao
                    );

            movimentacaoSalva =
                    movimentacaoRepository.save(
                            movimentacao
                    );
        }

        contaFinanceiraRepository
                .saveAndFlush(conta);

        LiquidacaoConta liquidacao =
                new LiquidacaoConta(
                        conta,
                        movimentacaoSalva,
                        request.valor(),
                        request.dataLiquidacao(),

                        normalizarTextoOpcional(
                                request.observacao()
                        )
                );

        LiquidacaoConta liquidacaoSalva =
                liquidacaoContaRepository.save(
                        liquidacao
                );

        return LiquidacaoContaResponse.de(
                liquidacaoSalva
        );
    }

    @Transactional(readOnly = true)
    public List<LiquidacaoContaResponse>
    listarLiquidacoes(
            Long empresaId,
            Long contaId) {

        buscarConta(
                empresaId,
                contaId
        );

        return liquidacaoContaRepository
                .findAllByContaFinanceira_IdAndContaFinanceira_Empresa_IdOrderByDataLiquidacaoDesc(
                        contaId,
                        empresaId
                )
                .stream()
                .map(LiquidacaoContaResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContaFinanceiraResponse>
    buscarLembretes(
            Long empresaId) {

        buscarEmpresa(empresaId);

        LocalDate dataAtual =
                LocalDate.now();

        LocalDate dataLimite =
                dataAtual.plusDays(
                        ANTECEDENCIA_PADRAO_LEMBRETE
                );

        return contaFinanceiraRepository
                .buscarLembretes(
                        empresaId,
                        dataLimite
                )
                .stream()
                .filter(
                        conta ->
                                conta.deveExibirLembrete(
                                        dataAtual
                                )
                )
                .map(
                        conta ->
                                ContaFinanceiraResponse.de(
                                        conta,
                                        dataAtual
                                )
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public ResumoContasFinanceirasResponse resumir(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        buscarEmpresa(empresaId);

        if (dataInicial == null) {
            dataInicial =
                    LocalDate.now();
        }

        if (dataFinal == null) {
            dataFinal =
                    dataInicial.plusDays(30);
        }

        if (dataFinal.isBefore(dataInicial)) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    "A data final não pode ser anterior "
                            + "à data inicial"
            );
        }

        BigDecimal totalAReceber =
                contaFinanceiraRepository
                        .somarValorPendentePorPeriodo(
                                empresaId,
                                TipoContaFinanceira.RECEBER,
                                dataInicial,
                                dataFinal
                        );

        BigDecimal totalAPagar =
                contaFinanceiraRepository
                        .somarValorPendentePorPeriodo(
                                empresaId,
                                TipoContaFinanceira.PAGAR,
                                dataInicial,
                                dataFinal
                        );

        BigDecimal diferencaPrevista =
                totalAReceber.subtract(
                        totalAPagar
                );

        List<ContaFinanceira> contas =
                contaFinanceiraRepository
                        .findAllByEmpresa_IdOrderByDataVencimentoAsc(
                                empresaId
                        );

        LocalDate hoje = LocalDate.now();

        LocalDate inicio = dataInicial;
        LocalDate fim = dataFinal;

        long quantidadeContasAReceber =
                contas.stream()
                        .filter(
                                conta ->
                                        conta.getTipo()
                                                == TipoContaFinanceira.RECEBER
                        )
                        .filter(this::estaPendente)
                        .filter(
                                conta ->
                                        estaDentroDoPeriodo(
                                                conta,
                                                inicio,
                                                fim
                                        )
                        )
                        .count();

        long quantidadeContasAPagar =
                contas.stream()
                        .filter(
                                conta ->
                                        conta.getTipo()
                                                == TipoContaFinanceira.PAGAR
                        )
                        .filter(this::estaPendente)
                        .filter(
                                conta ->
                                        estaDentroDoPeriodo(
                                                conta,
                                                inicio,
                                                fim
                                        )
                        )
                        .count();

        long quantidadeLembretes =
                contas.stream()
                        .filter(
                                conta ->
                                        conta.deveExibirLembrete(
                                                hoje
                                        )
                        )
                        .count();

        long quantidadeVencidas =
                contas.stream()
                        .filter(
                                conta ->
                                        conta.estaVencida(
                                                hoje
                                        )
                        )
                        .count();

        return new
                ResumoContasFinanceirasResponse(
                totalAReceber,
                totalAPagar,
                diferencaPrevista,
                quantidadeContasAReceber,
                quantidadeContasAPagar,
                quantidadeLembretes,
                quantidadeVencidas,
                dataInicial,
                dataFinal
        );
    }

    @Transactional(readOnly = true)
    public List<ProjecaoDiariaContaResponse>
    buscarProjecaoDiaria(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        buscarEmpresa(empresaId);

        LocalDate inicio =
                dataInicial == null
                        ? LocalDate.now()
                        : dataInicial;

        LocalDate fim =
                dataFinal == null
                        ? inicio.plusDays(30)
                        : dataFinal;

        if (fim.isBefore(inicio)) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    "A data final não pode ser anterior "
                            + "à data inicial"
            );
        }

        return contaFinanceiraRepository
                .buscarProjecaoDiaria(
                        empresaId,
                        inicio,
                        fim
                )
                .stream()
                .map(
                        ProjecaoDiariaContaResponse::de
                )
                .toList();
    }

    private ContaFinanceira buscarConta(
            Long empresaId,
            Long contaId) {

        return contaFinanceiraRepository
                .findByIdAndEmpresa_Id(
                        contaId,
                        empresaId
                )
                .orElseThrow(
                        () ->
                                new
                                        ContaFinanceiraNaoEncontradaException(
                                        contaId
                                )
                );
    }

    private Empresa buscarEmpresa(
            Long empresaId) {

        return empresaRepository
                .findById(empresaId)
                .orElseThrow(
                        () ->
                                new
                                        EmpresaNaoEncontradaException(
                                        empresaId
                                )
                );
    }

    private Categoria buscarCategoria(
            Long empresaId,
            Long categoriaId) {

        return categoriaRepository
                .findByIdAndEmpresa_Id(
                        categoriaId,
                        empresaId
                )
                .orElseThrow(
                        () ->
                                new
                                        CategoriaNaoEncontradaException(
                                        categoriaId
                                )
                );
    }

    private void validarDatas(
            LocalDate dataEmissao,
            LocalDate dataVencimento) {

        if (
                dataVencimento.isBefore(
                        dataEmissao
                )
        ) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    "A data de vencimento não pode ser "
                            + "anterior à data de emissão"
            );
        }
    }

    private void validarCategoriaCompativel(
            Categoria categoria,
            TipoContaFinanceira tipoConta) {

        TipoMovimentacao tipoEsperado =
                converterParaTipoMovimentacao(
                        tipoConta
                );

        if (
                categoria.getTipo()
                        != tipoEsperado
        ) {
            String mensagem =
                    tipoConta ==
                            TipoContaFinanceira.PAGAR
                            ? "Escolha uma categoria de despesa "
                            + "para a conta a pagar"
                            : "Escolha uma categoria de receita "
                            + "para a conta a receber";

            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    mensagem
            );
        }

        if (!categoria.isAtivo()) {
            throw new
                    OperacaoContaFinanceiraInvalidaException(
                    "A categoria escolhida está desativada"
            );
        }
    }

    private TipoMovimentacao
    converterParaTipoMovimentacao(
            TipoContaFinanceira tipoConta) {

        if (
                tipoConta ==
                        TipoContaFinanceira.PAGAR
        ) {
            return TipoMovimentacao.DESPESA;
        }

        return TipoMovimentacao.RECEITA;
    }

    private void configurarLembreteInicial(
            ContaFinanceira conta,
            Boolean lembreteAtivo,
            Integer antecedenciaDias) {

        if (Boolean.FALSE.equals(
                lembreteAtivo
        )) {
            conta.desativarLembrete();
            return;
        }

        int antecedencia =
                antecedenciaDias == null
                        ? ANTECEDENCIA_PADRAO_LEMBRETE
                        : antecedenciaDias;

        conta.ativarLembrete(
                antecedencia
        );
    }

    private boolean estaPendente(
            ContaFinanceira conta) {

        return conta.getSituacao()
                == SituacaoContaFinanceira.PENDENTE
                || conta.getSituacao()
                == SituacaoContaFinanceira.PARCIAL;
    }

    private boolean estaDentroDoPeriodo(
            ContaFinanceira conta,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        LocalDate vencimento =
                conta.getDataVencimento();

        return !vencimento.isBefore(
                dataInicial
        )
                && !vencimento.isAfter(
                dataFinal
        );
    }

    private String criarDescricaoMovimentacao(
            ContaFinanceira conta) {

        String prefixo =
                conta.getTipo()
                        == TipoContaFinanceira.PAGAR
                        ? "Pagamento: "
                        : "Recebimento: ";

        String descricao =
                prefixo
                        + conta.getDescricao();

        if (descricao.length() > 150) {
            return descricao.substring(
                    0,
                    150
            );
        }

        return descricao;
    }

    private String criarObservacaoMovimentacao(
            ContaFinanceira conta,
            String observacaoInformada) {

        String texto =
                "Gerada automaticamente pela conta "
                        + "financeira de código "
                        + conta.getId()
                        + ".";

        String observacaoNormalizada =
                normalizarTextoOpcional(
                        observacaoInformada
                );

        if (observacaoNormalizada != null) {
            texto =
                    texto
                            + " "
                            + observacaoNormalizada;
        }

        if (texto.length() > 500) {
            return texto.substring(
                    0,
                    500
            );
        }

        return texto;
    }

    private String normalizarTextoObrigatorio(
            String texto) {

        return texto
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizarTextoOpcional(
            String texto) {

        if (
                texto == null
                        || texto.isBlank()
        ) {
            return null;
        }

        return texto
                .trim()
                .replaceAll("\\s+", " ");
    }
}