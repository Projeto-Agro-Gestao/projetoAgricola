package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoNaoEncontradaException;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ColaboracaoService {

    private static final BigDecimal CEM = new BigDecimal("100");
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final PropriedadeRuralRepository propriedadeRepository;
    private final AtividadeRuralRepository atividadeRepository;
    private final DocumentoAgroRepository documentoRepository;
    private final PendenciaAgroRepository pendenciaRepository;
    private final PendenciaMensagemRepository mensagemRepository;
    private final RateioRepository rateioRepository;
    private final ContadorEmpresaRepository contadorEmpresaRepository;
    private final AuditoriaAgroRepository auditoriaRepository;
    private final ClassificacaoContabilRepository classificacaoContabilRepository;
    private final AnaliseFiscalMovimentacaoRepository analiseFiscalRepository;
    private final RegimeTributarioEmpresaRepository regimeTributarioRepository;
    private final ParametroTributarioRepository parametroTributarioRepository;

    public ColaboracaoService(
            EmpresaRepository empresaRepository,
            UsuarioRepository usuarioRepository,
            MovimentacaoRepository movimentacaoRepository,
            CategoriaRepository categoriaRepository,
            PropriedadeRuralRepository propriedadeRepository,
            AtividadeRuralRepository atividadeRepository,
            DocumentoAgroRepository documentoRepository,
            PendenciaAgroRepository pendenciaRepository,
            PendenciaMensagemRepository mensagemRepository,
            RateioRepository rateioRepository,
            ContadorEmpresaRepository contadorEmpresaRepository,
            AuditoriaAgroRepository auditoriaRepository,
            ClassificacaoContabilRepository classificacaoContabilRepository,
            AnaliseFiscalMovimentacaoRepository analiseFiscalRepository,
            RegimeTributarioEmpresaRepository regimeTributarioRepository,
            ParametroTributarioRepository parametroTributarioRepository) {

        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.categoriaRepository = categoriaRepository;
        this.propriedadeRepository = propriedadeRepository;
        this.atividadeRepository = atividadeRepository;
        this.documentoRepository = documentoRepository;
        this.pendenciaRepository = pendenciaRepository;
        this.mensagemRepository = mensagemRepository;
        this.rateioRepository = rateioRepository;
        this.contadorEmpresaRepository = contadorEmpresaRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.classificacaoContabilRepository = classificacaoContabilRepository;
        this.analiseFiscalRepository = analiseFiscalRepository;
        this.regimeTributarioRepository = regimeTributarioRepository;
        this.parametroTributarioRepository = parametroTributarioRepository;
    }

    @Transactional(readOnly = true)
    public ProdutorDashboardResponse dashboardProdutor(
            Long empresaId) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.withDayOfMonth(1);
        LocalDate fim = hoje.withDayOfMonth(
                hoje.lengthOfMonth()
        );

        BigDecimal receitas = normalizar(
                movimentacaoRepository.somarPorTipoEPeriodoEArea(
                        empresaId,
                        TipoMovimentacao.RECEITA,
                        inicio,
                        fim,
                        null
                )
        );

        BigDecimal despesas = normalizar(
                movimentacaoRepository.somarPorTipoEPeriodoEArea(
                        empresaId,
                        TipoMovimentacao.DESPESA,
                        inicio,
                        fim,
                        null
                )
        );

        return new ProdutorDashboardResponse(
                receitas,
                despesas,
                receitas.subtract(despesas),
                pendenciaRepository.countByEmpresa_IdAndStatusNot(
                        empresaId,
                        StatusPendenciaAgro.RESOLVIDA
                ),
                documentoRepository.countByEmpresa_IdAndMovimentacaoIsNull(
                        empresaId
                ),
                documentoRepository.countByEmpresa_IdAndStatus(
                        empresaId,
                        StatusDocumentoAgro.AGUARDANDO_ANALISE
                ),
                movimentacaoRepository
                        .countByEmpresa_IdAndCategoriaIsNullAndExcluidaFalse(
                                empresaId
                        )
        );
    }

    @Transactional(readOnly = true)
    public List<ContadorClienteResponse> carteiraContador() {

        Usuario contador = usuarioAtual();

        List<Empresa> empresas = empresasAcessiveisNaCarteira(contador);

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.withDayOfMonth(1);
        LocalDate fim = hoje.withDayOfMonth(
                hoje.lengthOfMonth()
        );

        return empresas.stream()
                .sorted(Comparator.comparing(Empresa::getNome))
                .map(empresa -> {
                    BigDecimal receitas = normalizar(
                            movimentacaoRepository.somarPorTipoEPeriodoEArea(
                                    empresa.getId(),
                                    TipoMovimentacao.RECEITA,
                                    inicio,
                                    fim,
                                    null
                            )
                    );
                    BigDecimal despesas = normalizar(
                            movimentacaoRepository.somarPorTipoEPeriodoEArea(
                                    empresa.getId(),
                                    TipoMovimentacao.DESPESA,
                                    inicio,
                                    fim,
                                    null
                            )
                    );
                    return new ContadorClienteResponse(
                            empresa.getId(),
                            empresa.getNome(),
                            empresa.isAtivo()
                                    ? "ATIVO"
                                    : "DESATIVADO",
                            pendenciaRepository
                                    .countByEmpresa_IdAndStatusNot(
                                            empresa.getId(),
                                            StatusPendenciaAgro.RESOLVIDA
                                    ),
                            movimentacaoRepository
                                    .countDespesasSemDocumento(
                                            empresa.getId()
                                    ),
                            movimentacaoRepository
                                    .countByEmpresa_IdAndCategoriaIsNullAndExcluidaFalse(
                                            empresa.getId()
                                    ),
                            documentoRepository
                                    .countByEmpresa_IdAndStatus(
                                            empresa.getId(),
                                            StatusDocumentoAgro.ENVIADO
                                    ),
                            receitas.subtract(despesas),
                            empresa.getAtualizadoEm()
                    );
                })
                .toList();
    }

    private List<Empresa> empresasAcessiveisNaCarteira(Usuario usuario) {

        if (isAdmin(usuario)) {
            return empresaRepository.findAll();
        }

        Map<Long, Empresa> empresasPorId = new LinkedHashMap<>();

        if (usuario.getEmpresa() != null
                && usuario.getEmpresa().getId() != null) {
            empresasPorId.put(
                    usuario.getEmpresa().getId(),
                    usuario.getEmpresa()
            );
        }

        if (usuario.getPapel() == PapelUsuario.CONTADOR) {
            List<Empresa> clientesVinculados = contadorEmpresaRepository
                    .findAllByContador_IdAndStatusOrderByEmpresa_NomeAsc(
                            usuario.getId(),
                            StatusVinculoContador.ATIVO
                    )
                    .stream()
                    .map(ContadorEmpresa::getEmpresa)
                    .filter(Objects::nonNull)
                    .toList();

            if (!clientesVinculados.isEmpty()) {
                empresasPorId.clear();
                clientesVinculados.forEach(empresa ->
                        empresasPorId.putIfAbsent(
                                empresa.getId(),
                                empresa
                        )
                );
            }
        }

        return List.copyOf(empresasPorId.values());
    }

    @Transactional
    public PropriedadeRuralResponse criarPropriedade(
            Long empresaId,
            CriarPropriedadeRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        PropriedadeRural propriedade =
                propriedadeRepository.save(
                        new PropriedadeRural(
                                empresa,
                                obrigatorio(request.nome(), "nome"),
                                request.municipio(),
                                request.estado(),
                                request.areaHectares()
                        )
                );

        auditar(empresa, usuario, "CRIAR_PROPRIEDADE",
                "PropriedadeRural", propriedade.getId(),
                propriedade.getNome());

        return PropriedadeRuralResponse.de(propriedade);
    }

    @Transactional(readOnly = true)
    public List<PropriedadeRuralResponse> listarPropriedades(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return propriedadeRepository
                .findAllByEmpresa_IdAndAtivaTrueOrderByNomeAsc(
                        empresaId
                )
                .stream()
                .map(PropriedadeRuralResponse::de)
                .toList();
    }

    @Transactional
    public AtividadeRuralResponse criarAtividade(
            Long empresaId,
            CriarAtividadeRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        AtividadeRural atividade =
                atividadeRepository.save(
                        new AtividadeRural(
                                empresa,
                                obrigatorio(request.nome(), "nome"),
                                request.tipo() == null
                                        ? TipoAtividadeRural.OUTRA
                                        : request.tipo()
                        )
                );

        auditar(empresa, usuario, "CRIAR_ATIVIDADE",
                "AtividadeRural", atividade.getId(),
                atividade.getNome());

        return AtividadeRuralResponse.de(atividade);
    }

    @Transactional(readOnly = true)
    public List<AtividadeRuralResponse> listarAtividades(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return atividadeRepository
                .findAllByEmpresa_IdAndAtivaTrueOrderByNomeAsc(
                        empresaId
                )
                .stream()
                .map(AtividadeRuralResponse::de)
                .toList();
    }

    @Transactional
    public DocumentoAgroResponse enviarDocumento(
            Long empresaId,
            Long movimentacaoId,
            TipoDocumentoAgro tipo,
            String observacao,
            MultipartFile arquivo) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        DocumentoUploadValidator.Arquivo arquivoValidado = DocumentoUploadValidator.validar(arquivo);

        Movimentacao movimentacao = movimentacaoId == null
                ? null
                : movimentacaoRepository
                        .findByIdAndEmpresa_IdAndExcluidaFalse(
                                movimentacaoId,
                                empresaId
                        )
                        .orElseThrow(() ->
                                new MovimentacaoNaoEncontradaException(
                                        movimentacaoId
                                )
                        );

        DocumentoAgro documento = documentoRepository.save(
                new DocumentoAgro(
                        empresa,
                        movimentacao,
                        usuario,
                        arquivoValidado.nome(),
                        arquivoValidado.tipoConteudo(),
                        (long) arquivoValidado.conteudo().length,
                        tipo == null ? TipoDocumentoAgro.OUTRO : tipo,
                        observacao,
                        arquivoValidado.conteudo()
                )
        );

        if (movimentacao != null) {
            pendenciaRepository
                    .findAllByEmpresa_IdAndMovimentacao_IdAndTipoAndStatusNotOrderByCriadoEmDesc(
                            empresaId,
                            movimentacao.getId(),
                            TipoPendenciaAgro.DOCUMENTO_AUSENTE,
                            StatusPendenciaAgro.RESOLVIDA
                    )
                    .forEach(pendencia -> pendencia.responderPeloProdutor(documento));
        }

        auditar(empresa, usuario, "ENVIAR_DOCUMENTO",
                "DocumentoAgro", documento.getId(), documento.getNomeArquivo());

        return DocumentoAgroResponse.de(documento);
    }

    @Transactional(readOnly = true)
    public List<DocumentoAgroResponse> listarDocumentos(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return documentoRepository
                .findAllByEmpresa_IdOrderByCriadoEmDesc(
                        empresaId
                )
                .stream()
                .map(DocumentoAgroResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentoAgro obterDocumento(
            Long empresaId,
            Long documentoId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return documentoRepository
                .findByIdAndEmpresa_Id(documentoId, empresaId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Documento nao encontrado."
                        )
                );
    }

    @Transactional
    public PendenciaAgroResponse criarPendencia(
            Long empresaId,
            CriarPendenciaRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        Movimentacao movimentacao = request.movimentacaoId() == null
                ? null
                : movimentacaoRepository
                        .findByIdAndEmpresa_IdAndExcluidaFalse(
                                request.movimentacaoId(),
                                empresaId
                        )
                        .orElseThrow(() ->
                                new MovimentacaoNaoEncontradaException(
                                        request.movimentacaoId()
                                )
                        );

        PendenciaAgro pendencia =
                pendenciaRepository.save(
                        new PendenciaAgro(
                                empresa,
                                movimentacao,
                                null,
                                usuario,
                                null,
                                request.tipo() == null
                                        ? TipoPendenciaAgro.OUTRA
                                        : request.tipo(),
                                request.prioridade(),
                                obrigatorio(
                                        request.titulo(),
                                        "titulo"
                                ),
                                request.descricao(),
                                request.vencimento()
                        )
                );

        mensagemRepository.save(
                new PendenciaMensagem(
                        pendencia,
                        usuario,
                        pendencia.getDescricao() == null
                                ? pendencia.getTitulo()
                                : pendencia.getDescricao()
                )
        );

        auditar(empresa, usuario, "CRIAR_PENDENCIA",
                "PendenciaAgro", pendencia.getId(),
                pendencia.getTitulo());

        return PendenciaAgroResponse.de(pendencia);
    }

    @Transactional(readOnly = true)
    public List<PendenciaAgroResponse> listarPendencias(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return pendenciaRepository
                .findAllByEmpresa_IdOrderByCriadoEmDesc(empresaId)
                .stream()
                .map(PendenciaAgroResponse::de)
                .toList();
    }

    @Transactional
    public PendenciaMensagemResponse comentarPendencia(
            Long empresaId,
            Long pendenciaId,
            CriarMensagemPendenciaRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        PendenciaAgro pendencia = obterPendencia(empresaId, pendenciaId);

        PendenciaMensagem mensagem =
                mensagemRepository.save(
                        new PendenciaMensagem(
                                pendencia,
                                usuario,
                                obrigatorio(
                                        request.mensagem(),
                                        "mensagem"
                                )
                        )
                );

        auditar(pendencia.getEmpresa(), usuario,
                "COMENTAR_PENDENCIA", "PendenciaAgro",
                pendencia.getId(), null);

        return PendenciaMensagemResponse.de(mensagem);
    }

    @Transactional
    public PendenciaAgroResponse resolverPendencia(
            Long empresaId,
            Long pendenciaId) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        PendenciaAgro pendencia = obterPendencia(empresaId, pendenciaId);
        pendencia.resolver();

        auditar(pendencia.getEmpresa(), usuario,
                "RESOLVER_PENDENCIA", "PendenciaAgro",
                pendencia.getId(), null);

        return PendenciaAgroResponse.de(pendencia);
    }

    @Transactional(readOnly = true)
    public List<PendenciaMensagemResponse> listarMensagens(
            Long empresaId,
            Long pendenciaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);
        PendenciaAgro pendencia = obterPendencia(empresaId, pendenciaId);

        return mensagemRepository
                .findAllByPendencia_IdOrderByCriadoEmAsc(
                        pendencia.getId()
                )
                .stream()
                .map(PendenciaMensagemResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassificacaoSugestaoResponse sugerirClassificacao(
            Long empresaId,
            SugerirClassificacaoRequest request) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        TipoMovimentacao tipo = request.tipo() == null
                ? TipoMovimentacao.DESPESA
                : request.tipo();

        String texto = (
                Objects.toString(request.descricao(), "")
                        + " "
                        + Objects.toString(request.fornecedor(), "")
        ).toLowerCase(Locale.ROOT);

        List<Categoria> categorias =
                categoriaRepository
                        .findAllByEmpresa_IdAndTipoAndAtivoTrueOrderByNomeAsc(
                                empresaId,
                                tipo
                        );

        Categoria melhor = categorias.stream()
                .filter(categoria ->
                        texto.contains(
                                categoria.getNome()
                                        .toLowerCase(Locale.ROOT)
                        )
                )
                .findFirst()
                .orElseGet(() -> categorias.stream()
                        .filter(categoria ->
                                combinaPalavraChave(
                                        texto,
                                        categoria.getNome()
                                )
                        )
                        .findFirst()
                        .orElse(categorias.isEmpty()
                                ? null
                                : categorias.get(0))
                );

        if (melhor == null) {
            return new ClassificacaoSugestaoResponse(
                    null,
                    null,
                    "Nenhuma categoria ativa encontrada.",
                    0
            );
        }

        int confianca = texto.contains(
                melhor.getNome().toLowerCase(Locale.ROOT)
        ) ? 85 : 55;

        return new ClassificacaoSugestaoResponse(
                melhor.getId(),
                melhor.getNome(),
                "Sugestao baseada em descricao, fornecedor e historico de categorias.",
                confianca
        );
    }

    @Transactional
    public RateioResponse criarRateio(
            Long empresaId,
            CriarRateioRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);
        Movimentacao movimentacao =
                movimentacaoRepository
                        .findByIdAndEmpresa_IdAndExcluidaFalse(
                                request.movimentacaoId(),
                                empresaId
                        )
                        .orElseThrow(() ->
                                new MovimentacaoNaoEncontradaException(
                                        request.movimentacaoId()
                                )
                        );

        if (rateioRepository
                .findByMovimentacao_IdAndEmpresa_Id(
                        movimentacao.getId(),
                        empresaId
                )
                .isPresent()) {
            throw new IllegalStateException(
                    "Esta movimentacao ja possui rateio."
            );
        }

        TipoRateio tipo = request.tipo() == null
                ? TipoRateio.PERCENTUAL
                : request.tipo();

        List<CriarRateioRequest.Item> itens = request.itens() == null
                ? List.of()
                : request.itens();

        if (itens.isEmpty()) {
            throw new IllegalArgumentException(
                    "Informe ao menos um item de rateio."
            );
        }

        validarTotalRateio(tipo, itens);

        Rateio rateio = new Rateio(
                empresa,
                movimentacao,
                tipo,
                request.observacao()
        );

        for (CriarRateioRequest.Item item : itens) {
            PropriedadeRural propriedade =
                    item.propriedadeRuralId() == null
                            ? null
                            : propriedadeRepository
                                    .findByIdAndEmpresa_Id(
                                            item.propriedadeRuralId(),
                                            empresaId
                                    )
                                    .orElseThrow(() ->
                                            new IllegalArgumentException(
                                                    "Propriedade nao encontrada."
                                            )
                                    );

            rateio.adicionarItem(
                    new RateioItem(
                            propriedade,
                            item.descricao(),
                            item.percentual(),
                            item.valor()
                    )
            );
        }

        Rateio salvo = rateioRepository.save(rateio);

        auditar(empresa, usuario, "CRIAR_RATEIO",
                "Rateio", salvo.getId(),
                movimentacao.getDescricao());

        return RateioResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public List<RateioResponse> listarRateios(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return rateioRepository
                .findAllByEmpresa_IdOrderByCriadoEmDesc(empresaId)
                .stream()
                .map(RateioResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public VisaoTributariaResponse visaoTributaria(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);
        Periodo periodo = periodoOuAnoAtual(dataInicial, dataFinal);

        BigDecimal receitas = normalizar(
                movimentacaoRepository.somarPorTipoEPeriodoEArea(
                        empresaId,
                        TipoMovimentacao.RECEITA,
                        periodo.inicio(),
                        periodo.fim(),
                        null
                )
        );

        BigDecimal despesas = normalizar(
                movimentacaoRepository.somarPorTipoEPeriodoEArea(
                        empresaId,
                        TipoMovimentacao.DESPESA,
                        periodo.inicio(),
                        periodo.fim(),
                        null
                )
        );

        BigDecimal resultado = receitas.subtract(despesas);
        int mesAtual = Math.max(1, periodo.fim().getMonthValue());
        BigDecimal projetado = resultado
                .divide(new BigDecimal(mesAtual), 2, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("12"));

        long pendenciasFiscais =
                pendenciaRepository.countByEmpresa_IdAndStatusNot(
                        empresaId,
                        StatusPendenciaAgro.RESOLVIDA
                )
                        + movimentacaoRepository
                                .countByEmpresa_IdAndCategoriaIsNullAndExcluidaFalse(
                                        empresaId
                                );

        return new VisaoTributariaResponse(
                periodo.fim().getYear(),
                receitas,
                despesas,
                resultado,
                projetado,
                pendenciasFiscais,
                "Estimativas para apoio ao planejamento. A validacao fiscal deve ser realizada pelo contador responsavel."
        );
    }

    @Transactional(readOnly = true)
    public ContadorDashboardFiscalResponse dashboardContabil(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);
        Periodo periodo = periodoOuAnoAtual(dataInicial, dataFinal);

        BigDecimal receitas = normalizar(
                movimentacaoRepository.somarPorTipoEPeriodoEArea(
                        empresaId,
                        TipoMovimentacao.RECEITA,
                        periodo.inicio(),
                        periodo.fim(),
                        null
                )
        );

        BigDecimal despesas = normalizar(
                movimentacaoRepository.somarPorTipoEPeriodoEArea(
                        empresaId,
                        TipoMovimentacao.DESPESA,
                        periodo.inicio(),
                        periodo.fim(),
                        null
                )
        );

        List<Movimentacao> movimentacoes =
                movimentacaoRepository.buscarPeriodoDesc(
                        empresaId,
                        periodo.inicio(),
                        periodo.fim()
                );

        List<AnaliseFiscalMovimentacao> analises =
                analiseFiscalRepository
                        .findAllByEmpresa_IdOrderByAtualizadoEmDesc(
                                empresaId
                        );
        Set<Long> movimentacaoIdsPeriodo =
                movimentacoes.stream()
                        .map(Movimentacao::getId)
                        .collect(Collectors.toSet());

        List<AnaliseFiscalMovimentacao> analisesPeriodo =
                analises.stream()
                        .filter(analise -> movimentacaoIdsPeriodo.contains(
                                analise.getMovimentacao().getId()
                        ))
                        .toList();

        BigDecimal potencialmenteDedutivel =
                somarAnalises(
                        analisesPeriodo,
                        StatusTratamentoFiscal.POTENCIALMENTE_DEDUTIVEL
                ).add(
                        somarAnalises(
                                analisesPeriodo,
                                StatusTratamentoFiscal.VALIDADO_PELO_CONTADOR
                        )
                );

        BigDecimal naoConsiderado =
                somarAnalises(
                        analisesPeriodo,
                        StatusTratamentoFiscal.NAO_DEDUTIVEL
                );

        BigDecimal baseEstimada =
                receitas.subtract(potencialmenteDedutivel);

        RegimeTributarioEmpresa regime =
                regimeTributarioRepository
                        .findFirstByEmpresa_IdAndDataInicioLessThanEqualAndSituacaoOrderByDataInicioDescIdDesc(
                                empresaId,
                                periodo.fim(),
                                "ATIVO"
                        )
                        .orElse(null);

        ParametroTributario parametro = regime == null
                ? null
                : parametroTributarioRepository
                        .findFirstByEmpresa_IdAndRegimeAndCompetenciaLessThanEqualOrderByCompetenciaDescIdDesc(
                                empresaId,
                                regime.getRegime(),
                                competencia(periodo.fim())
                        )
                        .orElse(null);

        BigDecimal tributoEstimado =
                calcularTributoEstimado(baseEstimada, parametro);

        long pendentesClassificacao = movimentacoes.stream()
                .filter(movimentacao -> movimentacao.getTipo()
                        == TipoMovimentacao.DESPESA)
                .filter(movimentacao -> analises.stream()
                        .noneMatch(analise -> analise.getMovimentacao()
                                .getId()
                                .equals(movimentacao.getId())))
                .count();

        return new ContadorDashboardFiscalResponse(
                empresa.getId(),
                empresa.getNome(),
                periodo.inicio(),
                periodo.fim(),
                receitas,
                despesas,
                receitas.subtract(despesas),
                documentoRepository
                        .findAllByEmpresa_IdOrderByCriadoEmDesc(empresaId)
                        .size(),
                documentoRepository.countByEmpresa_IdAndStatus(
                        empresaId,
                        StatusDocumentoAgro.AGUARDANDO_ANALISE
                ),
                movimentacaoRepository.countDespesasSemDocumento(empresaId),
                pendentesClassificacao,
                normalizar(potencialmenteDedutivel),
                normalizar(naoConsiderado),
                normalizar(baseEstimada),
                tributoEstimado,
                normalizar(receitas.subtract(despesas)
                        .subtract(tributoEstimado)),
                regime == null ? null : regime.getRegime(),
                "Valores estimados para apoio a analise. A apuracao fiscal definitiva deve ser validada pelo profissional responsavel."
        );
    }

    @Transactional(readOnly = true)
    public List<ContadorMovimentacaoFiscalResponse> listarMovimentacoesFiscais(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);
        Periodo periodo = periodoOuAnoAtual(dataInicial, dataFinal);

        List<Movimentacao> movimentacoes =
                movimentacaoRepository.buscarPeriodoDesc(
                        empresaId,
                        periodo.inicio(),
                        periodo.fim()
                );

        Map<Long, AnaliseFiscalMovimentacao> analisesPorMovimentacao =
                analiseFiscalRepository
                        .findAllByEmpresa_IdOrderByAtualizadoEmDesc(empresaId)
                        .stream()
                        .collect(Collectors.toMap(
                                analise -> analise.getMovimentacao().getId(),
                                analise -> analise,
                                (atual, ignorada) -> atual
                        ));

        Map<Long, List<DocumentoAgro>> documentosPorMovimentacao =
                documentoRepository
                        .findAllByEmpresa_IdOrderByCriadoEmDesc(empresaId)
                        .stream()
                        .filter(documento -> documento.getMovimentacao() != null)
                        .collect(Collectors.groupingBy(
                                documento -> documento.getMovimentacao().getId()
                        ));

        return movimentacoes.stream()
                .map(movimentacao -> {
                    AnaliseFiscalMovimentacao analise =
                            analisesPorMovimentacao.get(movimentacao.getId());
                    List<DocumentoAgro> documentos =
                            documentosPorMovimentacao.getOrDefault(
                                    movimentacao.getId(),
                                    List.of()
                            );

                    StatusDocumentoAgro statusDocumento =
                            documentos.stream()
                                    .map(DocumentoAgro::getStatus)
                                    .filter(Objects::nonNull)
                                    .findFirst()
                                    .orElse(null);

                    StatusTratamentoFiscal tratamento =
                            analise == null
                                    ? null
                                    : analise.getTratamentoFiscal();

                    return new ContadorMovimentacaoFiscalResponse(
                            movimentacao.getId(),
                            movimentacao.getDataMovimentacao(),
                            movimentacao.getTipo(),
                            movimentacao.getDescricao(),
                            movimentacao.getFornecedorNome(),
                            normalizar(movimentacao.getValor()),
                            movimentacao.getCategoria() == null
                                    ? null
                                    : movimentacao.getCategoria().getNome(),
                            movimentacao.getPropriedadeRural() == null
                                    ? null
                                    : movimentacao.getPropriedadeRural().getNome(),
                            movimentacao.getAtividadeRural() == null
                                    ? null
                                    : movimentacao.getAtividadeRural().getNome(),
                            documentos.size(),
                            !documentos.isEmpty(),
                            statusDocumento,
                            analise == null
                                    || analise.getClassificacaoContabil() == null
                                    ? null
                                    : analise.getClassificacaoContabil().getId(),
                            analise == null
                                    || analise.getClassificacaoContabil() == null
                                    ? null
                                    : analise.getClassificacaoContabil().getNome(),
                            tratamento,
                            analise == null
                                    ? null
                                    : analise.getStatus(),
                            analise == null
                                    ? null
                                    : normalizar(analise.getValorConsiderado()),
                            analise == null
                                    ? null
                                    : analise.getObservacao(),
                            tratamento == StatusTratamentoFiscal.POTENCIALMENTE_DEDUTIVEL
                                    || tratamento == StatusTratamentoFiscal.VALIDADO_PELO_CONTADOR
                                    || tratamento == StatusTratamentoFiscal.PARCIALMENTE_CONSIDERADO
                    );
                })
                .toList();
    }

    @Transactional
    public PendenciaAgroResponse solicitarDocumentoFiscal(
            Long empresaId,
            Long movimentacaoId) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);

        Movimentacao movimentacao =
                movimentacaoRepository
                        .findByIdAndEmpresa_IdAndExcluidaFalse(
                                movimentacaoId,
                                empresaId
                        )
                        .orElseThrow(() ->
                                new MovimentacaoNaoEncontradaException(
                                        movimentacaoId
                                )
                        );

        String titulo = "Documento solicitado pelo contador";
        String descricao =
                "Envie o documento referente a "
                        + movimentacao.getDescricao()
                        + " de "
                        + movimentacao.getDataMovimentacao()
                        + " no valor de R$ "
                        + normalizar(movimentacao.getValor())
                        + ".";

        PendenciaAgroResponse pendencia =
                criarPendencia(
                        empresaId,
                        new CriarPendenciaRequest(
                                movimentacaoId,
                                TipoPendenciaAgro.DOCUMENTO_SOLICITADO,
                                PrioridadePendenciaAgro.NORMAL,
                                titulo,
                                descricao,
                                null
                        )
                );

        auditar(movimentacao.getEmpresa(), usuario,
                "SOLICITAR_DOCUMENTO_FISCAL",
                "Movimentacao", movimentacao.getId(), descricao);

        return pendencia;
    }

    @Transactional
    public DocumentoAgroResponse vincularDocumentoFiscal(
            Long empresaId,
            Long documentoId,
            Long movimentacaoId) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);

        DocumentoAgro documento =
                documentoRepository
                        .findByIdAndEmpresa_Id(documentoId, empresaId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Documento nao encontrado."
                                )
                        );

        Movimentacao movimentacao =
                movimentacaoRepository
                        .findByIdAndEmpresa_IdAndExcluidaFalse(
                                movimentacaoId,
                                empresaId
                        )
                        .orElseThrow(() ->
                                new MovimentacaoNaoEncontradaException(
                                        movimentacaoId
                                )
                        );

        documento.vincularMovimentacao(movimentacao);
        DocumentoAgro salvo = documentoRepository.save(documento);

        auditar(movimentacao.getEmpresa(), usuario,
                "VINCULAR_DOCUMENTO_FISCAL",
                "DocumentoAgro", salvo.getId(),
                "Movimentacao " + movimentacao.getId());

        return DocumentoAgroResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public List<ClassificacaoContabilResponse> listarClassificacoesContabeis(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return classificacaoContabilRepository
                .findAllByEmpresa_IdAndAtivaTrueOrderByNomeAsc(empresaId)
                .stream()
                .map(ClassificacaoContabilResponse::de)
                .toList();
    }

    @Transactional
    public ClassificacaoContabilResponse salvarClassificacaoContabil(
            Long empresaId,
            SalvarClassificacaoContabilRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        ClassificacaoContabil classificacao =
                classificacaoContabilRepository.save(
                        new ClassificacaoContabil(
                                empresa,
                                obrigatorio(request.nome(), "nome"),
                                request.descricao()
                        )
                );

        auditar(empresa, usuario, "CRIAR_CLASSIFICACAO_CONTABIL",
                "ClassificacaoContabil", classificacao.getId(),
                classificacao.getNome());

        return ClassificacaoContabilResponse.de(classificacao);
    }

    @Transactional(readOnly = true)
    public List<AnaliseFiscalMovimentacaoResponse> listarAnalisesFiscais(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return analiseFiscalRepository
                .findAllByEmpresa_IdOrderByAtualizadoEmDesc(empresaId)
                .stream()
                .map(AnaliseFiscalMovimentacaoResponse::de)
                .toList();
    }

    @Transactional
    public AnaliseFiscalMovimentacaoResponse atualizarAnaliseFiscal(
            Long empresaId,
            Long movimentacaoId,
            AtualizarAnaliseFiscalRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Movimentacao movimentacao =
                movimentacaoRepository
                        .findByIdAndEmpresa_IdAndExcluidaFalse(
                                movimentacaoId,
                                empresaId
                        )
                        .orElseThrow(() ->
                                new MovimentacaoNaoEncontradaException(
                                        movimentacaoId
                                )
                        );

        ClassificacaoContabil classificacao =
                request.classificacaoContabilId() == null
                        ? null
                        : classificacaoContabilRepository
                                .findByIdAndEmpresa_Id(
                                        request.classificacaoContabilId(),
                                        empresaId
                                )
                                .orElseThrow(() ->
                                        new IllegalArgumentException(
                                                "Classificacao contabil nao encontrada."
                                        )
                                );

        AnaliseFiscalMovimentacao analise =
                analiseFiscalRepository
                        .findByEmpresa_IdAndMovimentacao_Id(
                                empresaId,
                                movimentacaoId
                        )
                        .orElseGet(() ->
                                new AnaliseFiscalMovimentacao(
                                        movimentacao.getEmpresa(),
                                        movimentacao
                                )
                        );

        analise.atualizar(
                classificacao,
                request.tratamentoFiscal(),
                request.status(),
                request.valorConsiderado(),
                request.observacao(),
                usuario
        );

        AnaliseFiscalMovimentacao salva =
                analiseFiscalRepository.save(analise);

        auditar(movimentacao.getEmpresa(), usuario,
                "ATUALIZAR_ANALISE_FISCAL", "Movimentacao",
                movimentacao.getId(), request.observacao());

        return AnaliseFiscalMovimentacaoResponse.de(salva);
    }

    @Transactional(readOnly = true)
    public List<RegimeTributarioEmpresaResponse> listarRegimesTributarios(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return regimeTributarioRepository
                .findAllByEmpresa_IdOrderByDataInicioDescIdDesc(empresaId)
                .stream()
                .map(RegimeTributarioEmpresaResponse::de)
                .toList();
    }

    @Transactional
    public RegimeTributarioEmpresaResponse salvarRegimeTributario(
            Long empresaId,
            SalvarRegimeTributarioRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        RegimeTributarioEmpresa regime =
                regimeTributarioRepository.save(
                        new RegimeTributarioEmpresa(
                                empresa,
                                request.regime() == null
                                        ? RegimeTributario.OUTRO
                                        : request.regime(),
                                request.dataInicio() == null
                                        ? LocalDate.now()
                                        : request.dataInicio(),
                                request.dataFim(),
                                request.competencia(),
                                request.observacao(),
                                usuario
                        )
                );

        auditar(empresa, usuario, "CONFIGURAR_REGIME_TRIBUTARIO",
                "RegimeTributarioEmpresa", regime.getId(),
                regime.getRegime().name());

        return RegimeTributarioEmpresaResponse.de(regime);
    }

    @Transactional(readOnly = true)
    public List<ParametroTributarioResponse> listarParametrosTributarios(
            Long empresaId) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        return parametroTributarioRepository
                .findAllByEmpresa_IdOrderByCompetenciaDescIdDesc(empresaId)
                .stream()
                .map(ParametroTributarioResponse::de)
                .toList();
    }

    @Transactional
    public ParametroTributarioResponse salvarParametroTributario(
            Long empresaId,
            SalvarParametroTributarioRequest request) {

        Usuario usuario = usuarioAtual();
        validarAcessoEmpresa(usuario, empresaId);
        Empresa empresa = obterEmpresa(empresaId);

        ParametroTributario parametro =
                parametroTributarioRepository.save(
                        new ParametroTributario(
                                empresa,
                                request.regime() == null
                                        ? RegimeTributario.OUTRO
                                        : request.regime(),
                                obrigatorio(
                                        request.competencia(),
                                        "competencia"
                                ),
                                request.nome(),
                                request.aliquotaPercentual(),
                                request.parcelaDeduzir(),
                                request.observacao(),
                                usuario
                        )
                );

        auditar(empresa, usuario, "CRIAR_PARAMETRO_TRIBUTARIO",
                "ParametroTributario", parametro.getId(),
                parametro.getCompetencia());

        return ParametroTributarioResponse.de(parametro);
    }

    @Transactional(readOnly = true)
    public SimulacaoTributariaResponse simularTributos(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        ContadorDashboardFiscalResponse dashboard =
                dashboardContabil(empresaId, dataInicial, dataFinal);

        BigDecimal carga = dashboard.receitaBruta().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : dashboard.tributoEstimado()
                        .multiply(CEM)
                        .divide(dashboard.receitaBruta(), 2, RoundingMode.HALF_UP);

        return new SimulacaoTributariaResponse(
                empresaId,
                dashboard.dataInicial(),
                dashboard.dataFinal(),
                dashboard.regimeAtual(),
                dashboard.receitaBruta(),
                dashboard.valorPotencialmenteDedutivel(),
                dashboard.baseEstimadaSimulacao(),
                dashboard.tributoEstimado(),
                carga,
                "Simulacao baseada nas movimentacoes reais, analises fiscais validadas e parametros tributarios configurados.",
                dashboard.aviso()
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportarMovimentacoesCsv(
            Long empresaId,
            LocalDate dataInicial,
            LocalDate dataFinal) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        List<Movimentacao> movimentacoes =
                movimentacaoRepository.buscarPeriodoDesc(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        StringBuilder csv = new StringBuilder();
        csv.append("data;tipo;descricao;categoria;valor;fornecedor;observacao\n");

        for (Movimentacao movimentacao : movimentacoes) {
            csv.append(movimentacao.getDataMovimentacao()).append(';')
                    .append(movimentacao.getTipo()).append(';')
                    .append(csv(movimentacao.getDescricao())).append(';')
                    .append(csv(movimentacao.getCategoria() == null
                            ? ""
                            : movimentacao.getCategoria().getNome()))
                    .append(';')
                    .append(movimentacao.getValor()).append(';')
                    .append(csv(movimentacao.getFornecedorNome())).append(';')
                    .append(csv(movimentacao.getObservacao()))
                    .append('\n');
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private PendenciaAgro obterPendencia(
            Long empresaId,
            Long pendenciaId) {

        return pendenciaRepository
                .findByIdAndEmpresa_Id(pendenciaId, empresaId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Pendencia nao encontrada."
                        )
                );
    }

    private Empresa obterEmpresa(Long empresaId) {
        return empresaRepository.findById(empresaId)
                .orElseThrow(() ->
                        new EmpresaNaoEncontradaException(empresaId)
                );
    }

    private Usuario usuarioAtual() {
        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new AccessDeniedException(
                    "Usuario nao autenticado."
            );
        }

        Long usuarioId = jwt.getClaim("usuarioId");
        return usuarioRepository.findById(usuarioId)
                .filter(Usuario::isAtivo)
                .filter(Usuario::isAcessoLiberado)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Usuario nao encontrado."
                        )
                );
    }

    private void validarAcessoEmpresa(
            Usuario usuario,
            Long empresaId) {

        if (isAdmin(usuario)
                || (
                        usuario.getEmpresa() != null
                                && usuario.getEmpresa().getId().equals(empresaId)
                )
                || (usuario.getPapel() == PapelUsuario.CONTADOR && contadorEmpresaRepository
                        .existsByContador_IdAndEmpresa_IdAndStatus(
                                usuario.getId(),
                                empresaId,
                                StatusVinculoContador.ATIVO
                        ))) {
            return;
        }

        throw new AccessDeniedException(
                "Voce nao possui acesso a esta empresa."
        );
    }

    private void validarContadorOuAdmin(Usuario usuario) {
        if (isAdmin(usuario)
                || usuario.getPapel() == PapelUsuario.CONTADOR) {
            return;
        }

        throw new AccessDeniedException(
                "Acesso restrito ao contador."
        );
    }

    private boolean isAdmin(Usuario usuario) {
        return usuario.getPapel() == PapelUsuario.ADMINISTRADOR
                || usuario.getPapel() == PapelUsuario.SUPER_ADMIN;
    }

    private void auditar(
            Empresa empresa,
            Usuario usuario,
            String acao,
            String entidade,
            Long entidadeId,
            String detalhes) {

        auditoriaRepository.save(
                new AuditoriaAgro(
                        empresa,
                        usuario,
                        acao,
                        entidade,
                        entidadeId,
                        detalhes
                )
        );
    }

    private void validarTotalRateio(
            TipoRateio tipo,
            List<CriarRateioRequest.Item> itens) {

        if (tipo == TipoRateio.PERCENTUAL) {
            BigDecimal total = itens.stream()
                    .map(CriarRateioRequest.Item::percentual)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (total.compareTo(CEM) != 0) {
                throw new IllegalArgumentException(
                        "O rateio percentual deve fechar exatamente 100%."
                );
            }
        }
    }

    private Periodo periodoOuAnoAtual(
            LocalDate dataInicial,
            LocalDate dataFinal) {

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = dataInicial == null
                ? LocalDate.of(hoje.getYear(), 1, 1)
                : dataInicial;
        LocalDate fim = dataFinal == null
                ? LocalDate.of(hoje.getYear(), 12, 31)
                : dataFinal;

        if (fim.isBefore(inicio)) {
            throw new IllegalArgumentException(
                    "A data final deve ser igual ou posterior a data inicial."
            );
        }

        return new Periodo(inicio, fim);
    }

    private BigDecimal somarAnalises(
            List<AnaliseFiscalMovimentacao> analises,
            StatusTratamentoFiscal tratamentoFiscal) {

        return analises.stream()
                .filter(analise -> analise.getTratamentoFiscal()
                        == tratamentoFiscal)
                .map(analise -> analise.getValorConsiderado() == null
                        ? analise.getMovimentacao().getValor()
                        : analise.getValorConsiderado())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularTributoEstimado(
            BigDecimal baseEstimada,
            ParametroTributario parametro) {

        if (parametro == null
                || parametro.getAliquotaPercentual() == null
                || baseEstimada.compareTo(BigDecimal.ZERO) <= 0) {
            return ZERO;
        }

        BigDecimal bruto = baseEstimada
                .multiply(parametro.getAliquotaPercentual())
                .divide(CEM, 2, RoundingMode.HALF_UP);

        BigDecimal parcela = parametro.getParcelaDeduzir() == null
                ? BigDecimal.ZERO
                : parametro.getParcelaDeduzir();

        BigDecimal resultado = bruto.subtract(parcela);
        return normalizar(resultado.max(BigDecimal.ZERO));
    }

    private String competencia(LocalDate data) {
        return "%04d-%02d".formatted(
                data.getYear(),
                data.getMonthValue()
        );
    }

    private boolean combinaPalavraChave(
            String texto,
            String categoriaNome) {

        String categoria =
                categoriaNome.toLowerCase(Locale.ROOT);

        return (texto.contains("posto")
                && categoria.contains("combust"))
                || (texto.contains("semente")
                && categoria.contains("semente"))
                || (texto.contains("adubo")
                && categoria.contains("insumo"))
                || (texto.contains("fertiliz")
                && categoria.contains("insumo"))
                || (texto.contains("venda")
                && categoria.contains("venda"));
    }

    private String obrigatorio(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(
                    "Informe " + campo + "."
            );
        }
        return valor.trim();
    }

    private BigDecimal normalizar(BigDecimal valor) {
        if (valor == null) {
            return ZERO;
        }
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private String csv(String valor) {
        if (valor == null) {
            return "";
        }
        return "\"" + valor.replace("\"", "\"\"") + "\"";
    }

    private record Periodo(LocalDate inicio, LocalDate fim) {
    }
}
