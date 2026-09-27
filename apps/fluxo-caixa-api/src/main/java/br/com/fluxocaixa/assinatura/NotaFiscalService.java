package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.integration.asaas.AsaasClient;
import br.com.fluxocaixa.integration.asaas.AsaasException;
import br.com.fluxocaixa.integration.asaas.AsaasInvoiceRequest;
import br.com.fluxocaixa.integration.asaas.AsaasInvoiceResponse;
import br.com.fluxocaixa.integration.asaas.AsaasInvoiceTaxesRequest;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class NotaFiscalService {

    private static final DateTimeFormatter COMPETENCIA =
            DateTimeFormatter.ofPattern("MM/yyyy");

    private final NotaFiscalRepository notaFiscalRepository;
    private final AssinaturaPagamentoRepository pagamentoRepository;
    private final AssinaturaAcessoService acessoService;
    private final AsaasClient asaasClient;

    public NotaFiscalService(
            NotaFiscalRepository notaFiscalRepository,
            AssinaturaPagamentoRepository pagamentoRepository,
            AssinaturaAcessoService acessoService,
            AsaasClient asaasClient) {

        this.notaFiscalRepository = notaFiscalRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.acessoService = acessoService;
        this.asaasClient = asaasClient;
    }

    @Transactional(readOnly = true)
    public List<NotaFiscalResponse> listarPorEmpresa(Long empresaId) {
        return notaFiscalRepository
                .findAllByEmpresa_IdOrderByCriadoEmDescIdDesc(empresaId)
                .stream()
                .map(NotaFiscalResponse::de)
                .toList();
    }

    @Transactional
    public NotaFiscalResponse emitir(Long empresaId, Long pagamentoId) {

        AssinaturaPagamento pagamento =
                pagamentoRepository
                        .findByIdAndEmpresa_Id(pagamentoId, empresaId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Pagamento nao encontrado."
                        ));

        return emitir(pagamento);
    }

    @Transactional
    public NotaFiscalResponse emitir(AssinaturaPagamento pagamento) {

        Optional<NotaFiscal> existente =
                notaFiscalRepository.findByPagamento_Id(
                        pagamento.getId()
                );

        if (existente.isPresent()) {
            return NotaFiscalResponse.de(existente.get());
        }

        garantirPagamentoConfirmado(pagamento);

        AssinaturaConfiguracao configuracao =
                acessoService.buscarConfiguracao();

        garantirConfiguracaoFiscal(configuracao);
        garantirFiscalInfoConfigurado();

        LocalDate emissao = LocalDate.now();
        String descricao = montarDescricao(configuracao, pagamento);
        String codigoServico = primeiroTexto(
                configuracao.getNfseMunicipalServiceCode(),
                configuracao.getNfseMunicipalServiceId()
        );

        AsaasInvoiceResponse response =
                asaasClient.criarNotaFiscal(
                        new AsaasInvoiceRequest(
                                pagamento.getAsaasPaymentId(),
                                descricao,
                                configuracao.getNfseDefaultObservations(),
                                "nfse-pagamento-" + pagamento.getId(),
                                pagamento.getValor(),
                                BigDecimal.ZERO,
                                emissao.toString(),
                                configuracao.getNfseMunicipalServiceId(),
                                configuracao.getNfseMunicipalServiceCode(),
                                configuracao.getNfseMunicipalServiceName(),
                                false,
                                new AsaasInvoiceTaxesRequest(
                                        configuracao.isNfseRetainIss(),
                                        configuracao.getNfseIss(),
                                        configuracao.getNfseCofins(),
                                        configuracao.getNfseCsll(),
                                        configuracao.getNfseInss(),
                                        configuracao.getNfseIr(),
                                        configuracao.getNfsePis()
                                )
                        )
                );

        NotaFiscal notaFiscal =
                new NotaFiscal(
                        pagamento.getEmpresa(),
                        pagamento,
                        response.id(),
                        mapearStatus(response.status()),
                        pagamento.getValor(),
                        emissao,
                        descricao,
                        codigoServico
                );

        aplicarRespostaAsaas(notaFiscal, response, null);

        return NotaFiscalResponse.de(
                notaFiscalRepository.saveAndFlush(notaFiscal)
        );
    }

    @Transactional
    public void emitirAutomaticamenteSeConfigurado(
            AssinaturaPagamento pagamento) {

        AssinaturaConfiguracao configuracao =
                acessoService.buscarConfiguracao();

        if (!configuracao.isNfseHabilitada()
                || !configuracao.isNfseEmissaoAutomatica()) {
            return;
        }

        if (notaFiscalRepository.findByPagamento_Id(pagamento.getId())
                .isPresent()) {
            return;
        }

        try {
            emitir(pagamento);
        } catch (RuntimeException ignored) {
            // A NFS-e nao deve derrubar confirmacao de pagamento.
        }
    }

    @Transactional
    public void processarWebhook(String evento, JsonNode invoice) {

        String invoiceId = invoice.path("id").asText("");

        if (invoiceId.isBlank()) {
            return;
        }

        notaFiscalRepository.findByAsaasInvoiceId(invoiceId)
                .ifPresent(nota ->
                        aplicarEventoWebhook(nota, evento, invoice)
                );
    }

    @Transactional
    public NotaFiscalResponse consultarStatus(
            Long empresaId,
            Long notaFiscalId) {

        NotaFiscal notaFiscal =
                notaFiscalRepository.findById(notaFiscalId)
                        .filter(nota ->
                                nota.getEmpresa().getId().equals(empresaId)
                        )
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Nota fiscal nao encontrada."
                        ));

        if (notaFiscal.getAsaasInvoiceId() == null
                || notaFiscal.getAsaasInvoiceId().isBlank()) {
            return NotaFiscalResponse.de(notaFiscal);
        }

        AsaasInvoiceResponse response =
                asaasClient.buscarNotaFiscal(
                        notaFiscal.getAsaasInvoiceId()
                );

        aplicarRespostaAsaas(notaFiscal, response, null);

        return NotaFiscalResponse.de(notaFiscal);
    }

    private void garantirPagamentoConfirmado(
            AssinaturaPagamento pagamento) {

        if (pagamento.getStatus() != StatusPagamentoAssinatura.CONFIRMED
                && pagamento.getStatus()
                != StatusPagamentoAssinatura.RECEIVED) {
            throw new IllegalStateException(
                    "Nota fiscal disponivel apos a confirmacao do pagamento."
            );
        }
    }

    private void garantirConfiguracaoFiscal(
            AssinaturaConfiguracao configuracao) {

        if (!configuracao.isNfseHabilitada()) {
            throw new IllegalStateException(
                    "Emissao de NFS-e ainda nao esta habilitada."
            );
        }

        if (isBlank(configuracao.getNfseMunicipalServiceName())
                || (isBlank(configuracao.getNfseMunicipalServiceCode())
                && isBlank(configuracao.getNfseMunicipalServiceId()))) {
            throw new IllegalStateException(
                    "Configure o servico municipal da NFS-e antes de emitir notas."
            );
        }
    }

    private void garantirFiscalInfoConfigurado() {
        try {
            asaasClient.buscarFiscalInfo();
        } catch (AsaasException exception) {
            throw new IllegalStateException(
                    "Emissao de NFS-e ainda nao esta configurada no Asaas.",
                    exception
            );
        }
    }

    private void aplicarEventoWebhook(
            NotaFiscal notaFiscal,
            String evento,
            JsonNode invoice) {

        NotaFiscalStatus status =
                switch (evento) {
                    case "INVOICE_AUTHORIZED" ->
                            NotaFiscalStatus.AUTHORIZED;
                    case "INVOICE_ERROR" ->
                            NotaFiscalStatus.ERROR;
                    case "INVOICE_CANCELED" ->
                            NotaFiscalStatus.CANCELLED;
                    case "INVOICE_PROCESSING_CANCELLATION" ->
                            NotaFiscalStatus.CANCELLATION_PENDING;
                    case "INVOICE_CANCELLATION_DENIED" ->
                            NotaFiscalStatus.CANCELLATION_DENIED;
                    case "INVOICE_CREATED",
                            "INVOICE_UPDATED",
                            "INVOICE_SYNCHRONIZED" ->
                            mapearStatus(invoice.path("status").asText(""));
                    default -> notaFiscal.getStatus();
                };

        notaFiscal.atualizarDeAsaas(
                invoice.path("id").asText(null),
                status,
                texto(invoice, "number"),
                texto(invoice, "validationCode"),
                texto(invoice, "pdfUrl"),
                texto(invoice, "xmlUrl"),
                data(invoice, "authorizedDate"),
                status == NotaFiscalStatus.ERROR
                        ? mensagemErro(invoice)
                        : null
        );
    }

    private void aplicarRespostaAsaas(
            NotaFiscal notaFiscal,
            AsaasInvoiceResponse response,
            String mensagemErro) {

        notaFiscal.atualizarDeAsaas(
                response.id(),
                mapearStatus(response.status()),
                response.number(),
                response.validationCode(),
                response.pdfUrl(),
                response.xmlUrl(),
                null,
                mensagemErro
        );
    }

    private NotaFiscalStatus mapearStatus(String status) {
        if (status == null || status.isBlank()) {
            return NotaFiscalStatus.PROCESSING;
        }

        return switch (status.trim().toUpperCase()) {
            case "SCHEDULED" -> NotaFiscalStatus.SCHEDULED;
            case "AUTHORIZED", "SYNCHRONIZED" ->
                    NotaFiscalStatus.AUTHORIZED;
            case "PROCESSING", "PENDING", "PENDING_AUTHORIZATION" ->
                    NotaFiscalStatus.PROCESSING;
            case "ERROR" -> NotaFiscalStatus.ERROR;
            case "CANCELED", "CANCELLED" -> NotaFiscalStatus.CANCELLED;
            case "PROCESSING_CANCELLATION" ->
                    NotaFiscalStatus.CANCELLATION_PENDING;
            case "CANCELLATION_DENIED" ->
                    NotaFiscalStatus.CANCELLATION_DENIED;
            default -> NotaFiscalStatus.PROCESSING;
        };
    }

    private String montarDescricao(
            AssinaturaConfiguracao configuracao,
            AssinaturaPagamento pagamento) {

        LocalDate competencia = pagamento.getPagoEm() == null
                ? LocalDate.now()
                : pagamento.getPagoEm();

        return configuracao.getNfseServiceDescriptionTemplate()
                .replace("{MM/AAAA}", competencia.format(COMPETENCIA));
    }

    private String mensagemErro(JsonNode invoice) {
        String erro = primeiroTexto(
                texto(invoice, "errorMessage"),
                texto(invoice, "statusDescription"),
                texto(invoice, "message")
        );

        return erro == null
                ? "Falha na emissao da NFS-e pelo Asaas."
                : erro;
    }

    private String texto(JsonNode node, String campo) {
        JsonNode valor = node.path(campo);
        return valor.isMissingNode() || valor.isNull()
                ? null
                : valor.asText(null);
    }

    private LocalDate data(JsonNode node, String campo) {
        String valor = texto(node, campo);
        return valor == null || valor.isBlank()
                ? null
                : LocalDate.parse(valor);
    }

    private String primeiroTexto(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.isBlank();
    }
}
