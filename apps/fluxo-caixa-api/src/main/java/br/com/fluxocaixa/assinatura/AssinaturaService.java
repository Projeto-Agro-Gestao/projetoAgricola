package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.categoria.AreaCategoria;
import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.integration.asaas.AsaasBoletoLinhaResponse;
import br.com.fluxocaixa.integration.asaas.AsaasClient;
import br.com.fluxocaixa.integration.asaas.AsaasCustomerRequest;
import br.com.fluxocaixa.integration.asaas.AsaasCustomerResponse;
import br.com.fluxocaixa.integration.asaas.AsaasPaymentRequest;
import br.com.fluxocaixa.integration.asaas.AsaasPaymentResponse;
import br.com.fluxocaixa.integration.asaas.AsaasPixQrCodeResponse;
import br.com.fluxocaixa.integration.asaas.AsaasProperties;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AssinaturaService {

    private static final String DESCRICAO_ASSINATURA =
            "Assinatura Gestao Agricola";

    private static final String CATEGORIA_ASSINATURA =
            "Assinatura Gestao Agricola";

    private final AssinaturaRepository assinaturaRepository;
    private final AssinaturaConfiguracaoRepository configuracaoRepository;
    private final AssinaturaPagamentoRepository pagamentoRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaRepository categoriaRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final AsaasClient asaasClient;
    private final AsaasProperties asaasProperties;
    private final AssinaturaAcessoService acessoService;
    private final UsuarioRepository usuarioRepository;

    public AssinaturaService(
            AssinaturaRepository assinaturaRepository,
            AssinaturaConfiguracaoRepository configuracaoRepository,
            AssinaturaPagamentoRepository pagamentoRepository,
            EmpresaRepository empresaRepository,
            CategoriaRepository categoriaRepository,
            MovimentacaoRepository movimentacaoRepository,
            AsaasClient asaasClient,
            AsaasProperties asaasProperties,
            AssinaturaAcessoService acessoService,
            UsuarioRepository usuarioRepository) {

        this.assinaturaRepository = assinaturaRepository;
        this.configuracaoRepository = configuracaoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaRepository = categoriaRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.asaasClient = asaasClient;
        this.asaasProperties = asaasProperties;
        this.acessoService = acessoService;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void iniciarAssinaturaParaNovaEmpresa(Empresa empresa) {

        AssinaturaConfiguracao configuracao =
                acessoService.buscarConfiguracao();

        LocalDate hoje = LocalDate.now();
        LocalDate fimTrial = configuracao.isTrialHabilitado()
                ? hoje.plusDays(configuracao.getDiasTrialPadrao())
                : null;

        Assinatura assinatura = new Assinatura(
                empresa,
                configuracao.isTrialHabilitado()
                        ? AssinaturaStatus.TRIAL
                        : AssinaturaStatus.PENDING,
                configuracao.getPrecoMensal(),
                configuracao.isTrialHabilitado() ? hoje : null,
                fimTrial
        );

        assinaturaRepository.save(assinatura);
    }

    @Transactional
    public AssinaturaDetalheResponse detalhar(Long empresaId) {

        Assinatura assinatura =
                buscarOuCriarAssinatura(empresaId);

        AssinaturaConfiguracao configuracao =
                acessoService.buscarConfiguracao();

        acessoService.atualizarStatusTrial(
                assinatura,
                LocalDate.now(),
                configuracao
        );

        List<AssinaturaPagamentoResponse> pagamentos =
                pagamentoRepository
                        .findAllByEmpresa_IdOrderByCriadoEmDescIdDesc(
                                empresaId
                        )
                        .stream()
                        .map(AssinaturaPagamentoResponse::de)
                        .toList();

        return new AssinaturaDetalheResponse(
                acessoService.montarResumo(
                        assinatura,
                        configuracao
                ),
                pagamentos
        );
    }

    @Transactional
    public AssinaturaPagamentoResponse criarPix(Long empresaId) {

        Assinatura assinatura =
                prepararAssinaturaParaCobranca(empresaId);

        AssinaturaPagamento pagamento =
                criarCobranca(
                        assinatura,
                        FormaPagamentoAssinatura.PIX
                );

        AsaasPixQrCodeResponse pix =
                asaasClient.buscarPixQrCode(
                        pagamento.getAsaasPaymentId()
                );

        pagamento.registrarPix(
                pix.encodedImage(),
                pix.payload(),
                pix.expirationDate()
        );

        return AssinaturaPagamentoResponse.de(
                pagamentoRepository.saveAndFlush(pagamento)
        );
    }

    @Transactional
    public AssinaturaDetalheResponse atualizarDocumentoPagamento(
            Long empresaId,
            AtualizarDocumentoPagamentoRequest request) {

        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() ->
                        new EmpresaNaoEncontradaException(empresaId)
                );

        empresa.alterarDocumento(
                validarDocumentoPagamento(request)
        );

        return detalhar(empresaId);
    }

    @Transactional
    public AssinaturaPagamentoResponse criarBoleto(Long empresaId) {

        Assinatura assinatura =
                prepararAssinaturaParaCobranca(empresaId);

        AssinaturaPagamento pagamento =
                criarCobranca(
                        assinatura,
                        FormaPagamentoAssinatura.BOLETO
                );

        AsaasBoletoLinhaResponse linha =
                asaasClient.buscarLinhaDigitavel(
                        pagamento.getAsaasPaymentId()
                );

        pagamento.registrarLinhaDigitavel(
                linha.identificationField()
        );

        return AssinaturaPagamentoResponse.de(
                pagamentoRepository.saveAndFlush(pagamento)
        );
    }

    @Transactional
    public void confirmarPagamento(
            String asaasPaymentId,
            LocalDate dataPagamento,
            boolean recebido) {

        AssinaturaPagamento pagamento =
                pagamentoRepository
                        .findByAsaasPaymentId(asaasPaymentId)
                        .orElse(null);

        if (pagamento == null) {
            return;
        }

        if (recebido) {
            pagamento.recebido(dataPagamento);
        } else {
            pagamento.confirmar(dataPagamento);
        }

        pagamento.getAssinatura().ativar(dataPagamento);

        if (pagamento.getMovimentacao() == null
                && !pagamentoRepository
                .existsByMovimentacaoIsNotNullAndAsaasPaymentId(
                        asaasPaymentId
                )) {
            pagamento.vincularMovimentacao(
                    criarMovimentacaoReceita(pagamento)
            );
        }
    }

    @Transactional
    public void marcarVencido(String asaasPaymentId) {

        pagamentoRepository.findByAsaasPaymentId(asaasPaymentId)
                .ifPresent(pagamento -> {
                    pagamento.vencido();
                    if (pagamento.getAssinatura().getStatus()
                            != AssinaturaStatus.ACTIVE) {
                        pagamento.getAssinatura()
                                .atualizarStatusCalculado(
                                        AssinaturaStatus.OVERDUE
                                );
                    }
                });
    }

    @Transactional
    public AssinaturaAdminResponse listarAdmin() {

        validarAdministrador();

        AssinaturaConfiguracao configuracao =
                acessoService.buscarConfiguracao();

        List<AssinaturaAdminClienteResponse> clientes =
                assinaturaRepository.findAll()
                        .stream()
                        .map(assinatura -> montarAdminCliente(
                                assinatura,
                                configuracao
                        ))
                        .toList();

        return new AssinaturaAdminResponse(
                AssinaturaConfiguracaoResponse.de(configuracao),
                clientes
        );
    }

    @Transactional
    public AssinaturaConfiguracaoResponse atualizarConfiguracao(
            AtualizarAssinaturaConfiguracaoRequest request) {

        validarAdministrador();

        AssinaturaConfiguracao configuracao =
                acessoService.buscarConfiguracao();

        configuracao.atualizar(
                request.precoMensal(),
                request.trialHabilitado(),
                request.diasTrialPadrao(),
                request.diasAvisoTrial(),
                request.diasCarencia()
        );

        return AssinaturaConfiguracaoResponse.de(configuracao);
    }

    @Transactional
    public AssinaturaResumoResponse adicionarDiasTrial(
            Long empresaId,
            AjustarTrialRequest request) {

        validarAdministrador();

        Assinatura assinatura = buscarOuCriarAssinatura(empresaId);
        LocalDate base = assinatura.getTrialFim() == null
                || assinatura.getTrialFim().isBefore(LocalDate.now())
                ? LocalDate.now()
                : assinatura.getTrialFim();

        int dias = request.dias() == null ? 1 : request.dias();
        assinatura.definirTrial(
                assinatura.getTrialInicio() == null
                        ? LocalDate.now()
                        : assinatura.getTrialInicio(),
                base.plusDays(dias)
        );

        return acessoService.obterResumo(empresaId);
    }

    @Transactional
    public AssinaturaResumoResponse definirFimTrial(
            Long empresaId,
            AjustarTrialRequest request) {

        validarAdministrador();

        if (request.trialFim() == null) {
            throw new IllegalArgumentException(
                    "Informe a data final do teste"
            );
        }

        Assinatura assinatura = buscarOuCriarAssinatura(empresaId);
        assinatura.definirTrial(
                assinatura.getTrialInicio() == null
                        ? LocalDate.now()
                        : assinatura.getTrialInicio(),
                request.trialFim()
        );

        return acessoService.obterResumo(empresaId);
    }

    @Transactional
    public AssinaturaResumoResponse encerrarTrial(Long empresaId) {

        validarAdministrador();

        Assinatura assinatura = buscarOuCriarAssinatura(empresaId);
        assinatura.encerrarTrial(LocalDate.now());

        return acessoService.obterResumo(empresaId);
    }

    @Transactional
    public AssinaturaResumoResponse alterarStatusManual(
            Long empresaId,
            AtualizarStatusAssinaturaRequest request) {

        validarAdministrador();

        Assinatura assinatura = buscarOuCriarAssinatura(empresaId);

        switch (request.status()) {
            case ACTIVE -> assinatura.reativar();
            case SUSPENDED -> assinatura.suspender();
            case CANCELLED -> assinatura.definirStatusManual(
                    AssinaturaStatus.CANCELLED);
            case PENDING -> assinatura.definirStatusManual(
                    AssinaturaStatus.PENDING);
            default -> assinatura.definirStatusManual(
                    request.status()
            );
        }

        return acessoService.obterResumo(empresaId);
    }

    private Assinatura prepararAssinaturaParaCobranca(Long empresaId) {

        Assinatura assinatura = buscarOuCriarAssinatura(empresaId);
        assinatura.atualizarValor(
                acessoService.buscarConfiguracao()
                        .getPrecoMensal()
        );

        if (assinatura.getAsaasCustomerId() == null) {
            assinatura.definirAsaasCustomerId(
                    criarClienteAsaas(assinatura)
            );
        }

        assinatura.pendente();
        return assinatura;
    }

    private AssinaturaPagamento criarCobranca(
            Assinatura assinatura,
            FormaPagamentoAssinatura formaPagamento) {

        String externalReference =
                "assinatura-" + assinatura.getId()
                        + "-" + UUID.randomUUID();

        LocalDate vencimento = LocalDate.now().plusDays(3);

        AsaasPaymentResponse response =
                asaasClient.criarPagamento(
                        new AsaasPaymentRequest(
                                assinatura.getAsaasCustomerId(),
                                formaPagamento.name(),
                                assinatura.getValorMensal(),
                                vencimento,
                                DESCRICAO_ASSINATURA,
                                externalReference
                        )
                );

        return pagamentoRepository.save(
                new AssinaturaPagamento(
                        assinatura,
                        response.id(),
                        externalReference,
                        DESCRICAO_ASSINATURA,
                        formaPagamento,
                        assinatura.getValorMensal(),
                        vencimento,
                        response.invoiceUrl(),
                        response.bankSlipUrl()
                )
        );
    }

    private String criarClienteAsaas(Assinatura assinatura) {

        Empresa empresa = assinatura.getEmpresa();
        String documento = normalizarDocumento(empresa.getDocumento());

        if (documento == null) {
            throw new IllegalArgumentException(
                    "Cadastre CPF ou CNPJ antes de gerar a cobranca."
            );
        }

        AsaasCustomerResponse response =
                asaasClient.criarCliente(
                        new AsaasCustomerRequest(
                                empresa.getNome(),
                                documento,
                                null,
                                null,
                                "empresa-" + empresa.getId(),
                                true
                        )
                );

        return response.id();
    }

    private Movimentacao criarMovimentacaoReceita(
            AssinaturaPagamento pagamento) {

        Categoria categoria =
                categoriaRepository
                        .findByEmpresa_IdAndNomeIgnoreCaseAndTipo(
                                pagamento.getEmpresa().getId(),
                                CATEGORIA_ASSINATURA,
                                TipoMovimentacao.RECEITA
                        )
                        .orElseGet(() ->
                                categoriaRepository.save(
                                        new Categoria(
                                                pagamento.getEmpresa(),
                                                CATEGORIA_ASSINATURA,
                                                TipoMovimentacao.RECEITA,
                                                AreaCategoria.GERAL
                                        )
                                )
                        );

        return movimentacaoRepository.save(
                new Movimentacao(
                        pagamento.getEmpresa(),
                        categoria,
                        DESCRICAO_ASSINATURA,
                        pagamento.getValor(),
                        TipoMovimentacao.RECEITA,
                        pagamento.getPagoEm() == null
                                ? LocalDate.now()
                                : pagamento.getPagoEm(),
                        "Receita registrada automaticamente pelo Asaas."
                )
        );
    }

    private Assinatura buscarOuCriarAssinatura(Long empresaId) {

        return assinaturaRepository.findByEmpresa_Id(empresaId)
                .orElseGet(() -> {
                    Empresa empresa =
                            empresaRepository.findById(empresaId)
                                    .orElseThrow(() ->
                                            new EmpresaNaoEncontradaException(
                                                    empresaId
                                            )
                                    );
                    iniciarAssinaturaParaNovaEmpresa(empresa);
                    return assinaturaRepository
                            .findByEmpresa_Id(empresaId)
                            .orElseThrow(
                                    AssinaturaNaoEncontradaException::new
                            );
                });
    }

    private AssinaturaAdminClienteResponse montarAdminCliente(
            Assinatura assinatura,
            AssinaturaConfiguracao configuracao) {

        AssinaturaPagamento ultimoPagamento =
                pagamentoRepository
                        .findFirstByEmpresa_IdOrderByCriadoEmDescIdDesc(
                                assinatura.getEmpresa().getId()
                        )
                        .orElse(null);

        Usuario usuario =
                usuarioRepository
                        .findFirstByEmpresa_IdOrderByIdAsc(
                                assinatura.getEmpresa().getId()
                        )
                        .orElse(null);

        acessoService.atualizarStatusTrial(
                assinatura,
                LocalDate.now(),
                configuracao
        );

        return new AssinaturaAdminClienteResponse(
                usuario == null ? null : usuario.getId(),
                assinatura.getEmpresa().getId(),
                usuario == null
                        ? assinatura.getEmpresa().getNome()
                        : usuario.getNome(),
                assinatura.getEmpresa().getNome(),
                usuario == null ? null : usuario.getEmail(),
                "Gestao Agricola",
                assinatura.getValorMensal(),
                acessoService.calcularStatusAtual(
                        assinatura,
                        LocalDate.now(),
                        configuracao
                ),
                assinatura.getTrialInicio(),
                assinatura.getTrialFim(),
                acessoService.montarResumo(
                        assinatura,
                        configuracao
                ).diasRestantesTrial(),
                assinatura.getProximoVencimento(),
                assinatura.getUltimoPagamentoEm(),
                ultimoPagamento == null
                        ? null
                        : ultimoPagamento.getFormaPagamento().name()
        );
    }

    private String normalizarDocumento(String documento) {
        if (documento == null || documento.isBlank()) {
            return null;
        }
        return documento.replaceAll("[^0-9]", "");
    }

    private String validarDocumentoPagamento(
            AtualizarDocumentoPagamentoRequest request) {

        String tipo = request.tipoDocumento() == null
                ? ""
                : request.tipoDocumento().trim().toUpperCase();

        String documento = normalizarDocumento(request.documento());

        if (!"CPF".equals(tipo) && !"CNPJ".equals(tipo)) {
            throw new IllegalArgumentException(
                    "Escolha CPF ou CNPJ para pagamento."
            );
        }

        if ("CPF".equals(tipo) && documento.length() != 11) {
            throw new IllegalArgumentException(
                    "CPF deve possuir 11 digitos."
            );
        }

        if ("CNPJ".equals(tipo) && documento.length() != 14) {
            throw new IllegalArgumentException(
                    "CNPJ deve possuir 14 digitos."
            );
        }

        return documento;
    }

    private boolean isProducao() {
        return "PRODUCAO".equalsIgnoreCase(
                asaasProperties.environment()
        ) || "PRODUCTION".equalsIgnoreCase(
                asaasProperties.environment()
        );
    }

    private void validarAdministrador() {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Jwt jwt)
                || !PapelUsuario.ADMINISTRADOR.name()
                .equals(jwt.getClaimAsString("papel"))) {
            throw new IllegalArgumentException(
                    "Acesso administrativo negado"
            );
        }
    }
}
