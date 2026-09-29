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
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

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
            AuditoriaAgroRepository auditoriaRepository) {

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

        if (!isAdmin(contador)
                && contador.getPapel() != PapelUsuario.CONTADOR) {
            return List.of();
        }

        List<ContadorEmpresa> vinculos = isAdmin(contador)
                ? empresaRepository.findAll()
                        .stream()
                        .map(empresa -> new ContadorEmpresa(contador, empresa))
                        .toList()
                : contadorEmpresaRepository
                        .findAllByContador_IdAndStatusOrderByEmpresa_NomeAsc(
                                contador.getId(),
                                StatusVinculoContador.ATIVO
                        );

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.withDayOfMonth(1);
        LocalDate fim = hoje.withDayOfMonth(
                hoje.lengthOfMonth()
        );

        return vinculos.stream()
                .map(ContadorEmpresa::getEmpresa)
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

        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException(
                    "Informe um arquivo para enviar."
            );
        }

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

        try {
            DocumentoAgro documento = documentoRepository.save(
                    new DocumentoAgro(
                            empresa,
                            movimentacao,
                            usuario,
                            arquivo.getOriginalFilename() == null
                                    ? "documento"
                                    : arquivo.getOriginalFilename(),
                            arquivo.getContentType() == null
                                    ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                                    : arquivo.getContentType(),
                            arquivo.getSize(),
                            tipo == null
                                    ? TipoDocumentoAgro.OUTRO
                                    : tipo,
                            observacao,
                            arquivo.getBytes()
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
                        .forEach(pendencia ->
                                pendencia.responderPeloProdutor(documento)
                        );
            }

            auditar(empresa, usuario, "ENVIAR_DOCUMENTO",
                    "DocumentoAgro", documento.getId(),
                    documento.getNomeArquivo());

            return DocumentoAgroResponse.de(documento);
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Nao foi possivel ler o documento enviado.",
                    exception
            );
        }
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
            int ano) {

        validarAcessoEmpresa(usuarioAtual(), empresaId);

        LocalDate inicio = LocalDate.of(ano, 1, 1);
        LocalDate fim = LocalDate.of(ano, 12, 31);

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

        BigDecimal resultado = receitas.subtract(despesas);
        int mesAtual = Math.max(1, LocalDate.now().getMonthValue());
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
                ano,
                receitas,
                despesas,
                resultado,
                projetado,
                pendenciasFiscais,
                "Estimativas para apoio ao planejamento. A validacao fiscal deve ser realizada pelo contador responsavel."
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
                || contadorEmpresaRepository
                        .existsByContador_IdAndEmpresa_IdAndStatus(
                                usuario.getId(),
                                empresaId,
                                StatusVinculoContador.ATIVO
                        )) {
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
}
