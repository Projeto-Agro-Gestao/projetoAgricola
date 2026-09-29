package br.com.fluxocaixa.movimentacao;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaNaoEncontradaException;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.colaboracao.AtividadeRural;
import br.com.fluxocaixa.colaboracao.AtividadeRuralRepository;
import br.com.fluxocaixa.colaboracao.PendenciaAgro;
import br.com.fluxocaixa.colaboracao.PendenciaAgroRepository;
import br.com.fluxocaixa.colaboracao.PrioridadePendenciaAgro;
import br.com.fluxocaixa.colaboracao.PropriedadeRural;
import br.com.fluxocaixa.colaboracao.PropriedadeRuralRepository;
import br.com.fluxocaixa.colaboracao.StatusPendenciaAgro;
import br.com.fluxocaixa.colaboracao.TipoPendenciaAgro;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.fornecedor.Fornecedor;
import br.com.fluxocaixa.fornecedor.FornecedorService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MovimentacaoService {

    private final MovimentacaoRepository movimentacaoRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaRepository categoriaRepository;
    private final FornecedorService fornecedorService;
    private final PropriedadeRuralRepository propriedadeRuralRepository;
    private final AtividadeRuralRepository atividadeRuralRepository;
    private final PendenciaAgroRepository pendenciaAgroRepository;

    public MovimentacaoService(
            MovimentacaoRepository movimentacaoRepository,
            EmpresaRepository empresaRepository,
            CategoriaRepository categoriaRepository,
            FornecedorService fornecedorService,
            PropriedadeRuralRepository propriedadeRuralRepository,
            AtividadeRuralRepository atividadeRuralRepository,
            PendenciaAgroRepository pendenciaAgroRepository) {

        this.movimentacaoRepository = movimentacaoRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaRepository = categoriaRepository;
        this.fornecedorService = fornecedorService;
        this.propriedadeRuralRepository = propriedadeRuralRepository;
        this.atividadeRuralRepository = atividadeRuralRepository;
        this.pendenciaAgroRepository = pendenciaAgroRepository;
    }

    @Transactional
    public MovimentacaoResponse criar(
            Long empresaId,
            CriarMovimentacaoRequest request) {

        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(
                        () -> new EmpresaNaoEncontradaException(empresaId)
                );

        Categoria categoria = buscarCategoriaValida(
                empresaId,
                request.categoriaId(),
                request.tipo()
        );

        String descricao =
                normalizarTextoObrigatorio(request.descricao());

        String observacao =
                normalizarTextoOpcional(request.observacao());

        Fornecedor fornecedor =
                buscarFornecedorSeInformado(
                        empresaId,
                        request.fornecedorId(),
                        request.tipo()
                );

        PropriedadeRural propriedadeRural =
                buscarPropriedadeSeInformada(
                        empresaId,
                        request.propriedadeRuralId()
                );

        AtividadeRural atividadeRural =
                buscarAtividadeSeInformada(
                        empresaId,
                        request.atividadeRuralId()
                );

        Movimentacao movimentacao = new Movimentacao(
                empresa,
                categoria,
                descricao,
                request.valor(),
                request.tipo(),
                request.dataMovimentacao(),
                observacao,
                fornecedor,
                normalizarTextoOpcional(
                        request.compradorNome()
                ),
                null,
                normalizarTextoOpcional(request.produtoNome()),
                normalizarTextoOpcional(
                        request.produtoClassificacao()
                ),
                request.quantidade(),
                normalizarTextoOpcional(request.unidadeMedida()),
                propriedadeRural,
                atividadeRural
        );

        Movimentacao movimentacaoSalva =
                movimentacaoRepository.save(movimentacao);

        criarPendenciaDocumentoAusenteSeNecessario(
                empresa,
                movimentacaoSalva
        );

        return MovimentacaoResponse.de(movimentacaoSalva);
    }

    @Transactional(readOnly = true)
    public Page<MovimentacaoResponse> listar(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            TipoMovimentacao tipo,
            Long categoriaId,
            Pageable pageable) {

        verificarEmpresa(empresaId);
        verificarPeriodo(dataInicial, dataFinal);

        if (categoriaId != null) {
            categoriaRepository
                    .findByIdAndEmpresa_Id(categoriaId, empresaId)
                    .orElseThrow(
                            () -> new CategoriaNaoEncontradaException(
                                    categoriaId
                            )
                    );
        }

        return movimentacaoRepository.buscar(
                        empresaId,
                        dataInicial,
                        dataFinal,
                        tipo,
                        categoriaId,
                        pageable
                )
                .map(MovimentacaoResponse::de);
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listarParaExportacao(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            TipoMovimentacao tipo,
            Long categoriaId) {

        verificarEmpresa(empresaId);
        verificarPeriodo(dataInicial, dataFinal);

        if (categoriaId != null) {
            categoriaRepository
                    .findByIdAndEmpresa_Id(
                            categoriaId,
                            empresaId
                    )
                    .orElseThrow(
                            () -> new CategoriaNaoEncontradaException(
                                    categoriaId
                            )
                    );
        }

        return movimentacaoRepository
                .buscarParaExportacao(
                        empresaId,
                        dataInicial,
                        dataFinal,
                        tipo,
                        categoriaId
                )
                .stream()
                .map(MovimentacaoResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listarLixeira(
            Long empresaId) {

        verificarEmpresa(empresaId);

        return movimentacaoRepository
                .buscarLixeira(empresaId)
                .stream()
                .map(MovimentacaoResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public MovimentacaoResponse buscarPorId(
            Long empresaId,
            Long movimentacaoId) {

        verificarEmpresa(empresaId);

        Movimentacao movimentacao = buscarMovimentacao(
                empresaId,
                movimentacaoId
        );

        return MovimentacaoResponse.de(movimentacao);
    }

    @Transactional
    public MovimentacaoResponse atualizar(
            Long empresaId,
            Long movimentacaoId,
            AtualizarMovimentacaoRequest request) {

        verificarEmpresa(empresaId);

        Movimentacao movimentacao = buscarMovimentacao(
                empresaId,
                movimentacaoId
        );

        Categoria categoria = buscarCategoriaValida(
                empresaId,
                request.categoriaId(),
                request.tipo()
        );

        String descricao =
                normalizarTextoObrigatorio(request.descricao());

        String observacao =
                normalizarTextoOpcional(request.observacao());

        Fornecedor fornecedor =
                buscarFornecedorSeInformado(
                        empresaId,
                        request.fornecedorId(),
                        request.tipo()
                );

        PropriedadeRural propriedadeRural =
                buscarPropriedadeSeInformada(
                        empresaId,
                        request.propriedadeRuralId()
                );

        AtividadeRural atividadeRural =
                buscarAtividadeSeInformada(
                        empresaId,
                        request.atividadeRuralId()
                );

        movimentacao.atualizar(
                categoria,
                descricao,
                request.valor(),
                request.tipo(),
                request.dataMovimentacao(),
                observacao,
                fornecedor,
                normalizarTextoOpcional(
                        request.compradorNome()
                ),
                null,
                normalizarTextoOpcional(request.produtoNome()),
                normalizarTextoOpcional(
                        request.produtoClassificacao()
                ),
                request.quantidade(),
                normalizarTextoOpcional(request.unidadeMedida()),
                propriedadeRural,
                atividadeRural
        );

        Movimentacao movimentacaoAtualizada =
                movimentacaoRepository.saveAndFlush(movimentacao);

        criarPendenciaDocumentoAusenteSeNecessario(
                movimentacaoAtualizada.getEmpresa(),
                movimentacaoAtualizada
        );

        return MovimentacaoResponse.de(movimentacaoAtualizada);
    }

    @Transactional
    public void excluir(
            Long empresaId,
            Long movimentacaoId) {

        moverParaLixeira(
                empresaId,
                movimentacaoId
        );
    }

    @Transactional
    public MovimentacaoResponse moverParaLixeira(
            Long empresaId,
            Long movimentacaoId) {

        verificarEmpresa(empresaId);

        Movimentacao movimentacao = buscarMovimentacao(
                empresaId,
                movimentacaoId
        );

        movimentacao.moverParaLixeira();

        Movimentacao movimentacaoAtualizada =
                movimentacaoRepository.saveAndFlush(
                        movimentacao
                );

        return MovimentacaoResponse.de(
                movimentacaoAtualizada
        );
    }

    @Transactional
    public void excluirPermanentemente(
            Long empresaId,
            Long movimentacaoId) {

        verificarEmpresa(empresaId);

        Movimentacao movimentacao =
                buscarMovimentacaoExcluida(
                        empresaId,
                        movimentacaoId
                );

        movimentacaoRepository.delete(
                movimentacao
        );
    }

    @Transactional
    public MovimentacaoResponse restaurar(
            Long empresaId,
            Long movimentacaoId,
            RestaurarMovimentacaoRequest request) {

        verificarEmpresa(empresaId);

        Movimentacao movimentacao =
                buscarMovimentacaoExcluida(
                        empresaId,
                        movimentacaoId
                );

        Categoria categoria =
                buscarCategoriaValida(
                        empresaId,
                        request.categoriaId(),
                        movimentacao.getTipo()
                );

        movimentacao.restaurar(categoria);

        Movimentacao movimentacaoAtualizada =
                movimentacaoRepository.saveAndFlush(
                        movimentacao
                );

        return MovimentacaoResponse.de(
                movimentacaoAtualizada
        );
    }

    @Transactional
    public MovimentacaoResponse trocarCategoria(
            Long empresaId,
            Long movimentacaoId,
            TrocarCategoriaMovimentacaoRequest request) {

        verificarEmpresa(empresaId);

        Movimentacao movimentacao = buscarMovimentacao(
                empresaId,
                movimentacaoId
        );

        Categoria categoria =
                categoriaRepository
                        .findByIdAndEmpresa_Id(
                                request.categoriaId(),
                                empresaId
                        )
                        .filter(Categoria::isAtivo)
                        .orElseThrow(
                                () -> new CategoriaNaoEncontradaException(
                                        request.categoriaId()
                                )
                        );

        movimentacao.trocarCategoria(categoria);

        Movimentacao movimentacaoAtualizada =
                movimentacaoRepository.saveAndFlush(
                        movimentacao
                );

        return MovimentacaoResponse.de(
                movimentacaoAtualizada
        );
    }

    private Movimentacao buscarMovimentacao(
            Long empresaId,
            Long movimentacaoId) {

        return movimentacaoRepository
                .findByIdAndEmpresa_IdAndExcluidaFalse(
                        movimentacaoId,
                        empresaId
                )
                .orElseThrow(
                        () -> new MovimentacaoNaoEncontradaException(
                                movimentacaoId
                        )
                );
    }

    private Movimentacao buscarMovimentacaoExcluida(
            Long empresaId,
            Long movimentacaoId) {

        return movimentacaoRepository
                .findByIdAndEmpresa_IdAndExcluidaTrue(
                        movimentacaoId,
                        empresaId
                )
                .orElseThrow(
                        () -> new MovimentacaoNaoEncontradaException(
                                movimentacaoId
                        )
                );
    }

    private Categoria buscarCategoriaValida(
            Long empresaId,
            Long categoriaId,
            TipoMovimentacao tipo) {

        Categoria categoria = categoriaRepository
                .findByIdAndEmpresa_Id(
                        categoriaId,
                        empresaId
                )
                .filter(Categoria::isAtivo)
                .orElseThrow(
                        () -> new CategoriaNaoEncontradaException(
                                categoriaId
                        )
                );

        if (categoria.getTipo() != tipo) {
            throw new TipoMovimentacaoIncompativelException(
                    tipo,
                    categoria.getTipo()
            );
        }

        return categoria;
    }

    private void verificarEmpresa(Long empresaId) {

        if (!empresaRepository.existsById(empresaId)) {
            throw new EmpresaNaoEncontradaException(empresaId);
        }
    }

    private void verificarPeriodo(
            LocalDate dataInicial,
            LocalDate dataFinal) {

        if (dataInicial.isAfter(dataFinal)) {
            throw new PeriodoInvalidoException();
        }
    }

    private PropriedadeRural buscarPropriedadeSeInformada(
            Long empresaId,
            Long propriedadeRuralId) {

        if (propriedadeRuralId == null) {
            return null;
        }

        return propriedadeRuralRepository
                .findByIdAndEmpresa_Id(propriedadeRuralId, empresaId)
                .filter(PropriedadeRural::isAtiva)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Propriedade nao encontrada."
                        )
                );
    }

    private AtividadeRural buscarAtividadeSeInformada(
            Long empresaId,
            Long atividadeRuralId) {

        if (atividadeRuralId == null) {
            return null;
        }

        return atividadeRuralRepository
                .findByIdAndEmpresa_Id(atividadeRuralId, empresaId)
                .filter(AtividadeRural::isAtiva)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Atividade nao encontrada."
                        )
                );
    }

    private void criarPendenciaDocumentoAusenteSeNecessario(
            Empresa empresa,
            Movimentacao movimentacao) {

        if (movimentacao.getTipo() != TipoMovimentacao.DESPESA
                || pendenciaAgroRepository
                        .existsByEmpresa_IdAndMovimentacao_IdAndTipoAndStatusNot(
                                empresa.getId(),
                                movimentacao.getId(),
                                TipoPendenciaAgro.DOCUMENTO_AUSENTE,
                                StatusPendenciaAgro.RESOLVIDA
                        )) {
            return;
        }

        pendenciaAgroRepository.save(
                new PendenciaAgro(
                        empresa,
                        movimentacao,
                        null,
                        null,
                        null,
                        TipoPendenciaAgro.DOCUMENTO_AUSENTE,
                        PrioridadePendenciaAgro.NORMAL,
                        "Documento pendente",
                        "Anexe a nota fiscal, recibo ou comprovante desta despesa para o contador revisar.",
                        null
                )
        );
    }

    private Fornecedor buscarFornecedorSeInformado(
            Long empresaId,
            Long fornecedorId,
            TipoMovimentacao tipo) {

        if (
                fornecedorId == null
                || tipo != TipoMovimentacao.DESPESA
        ) {
            return null;
        }

        return fornecedorService.buscarFornecedorAtivo(
                empresaId,
                fornecedorId
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
}
