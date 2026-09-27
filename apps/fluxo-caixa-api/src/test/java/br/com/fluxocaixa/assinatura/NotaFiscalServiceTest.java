package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.integration.asaas.AsaasClient;
import br.com.fluxocaixa.integration.asaas.AsaasFiscalInfoResponse;
import br.com.fluxocaixa.integration.asaas.AsaasInvoiceRequest;
import br.com.fluxocaixa.integration.asaas.AsaasInvoiceResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotaFiscalServiceTest {

    private final NotaFiscalRepository notaFiscalRepository =
            mock(NotaFiscalRepository.class);
    private final AssinaturaPagamentoRepository pagamentoRepository =
            mock(AssinaturaPagamentoRepository.class);
    private final AssinaturaAcessoService acessoService =
            mock(AssinaturaAcessoService.class);
    private final AsaasClient asaasClient =
            mock(AsaasClient.class);

    private final NotaFiscalService service =
            new NotaFiscalService(
                    notaFiscalRepository,
                    pagamentoRepository,
                    acessoService,
                    asaasClient
            );

    @Test
    void pagamentoPendenteNaoPermiteNotaFiscal() {
        AssinaturaPagamento pagamento = pagamentoPendente();

        when(pagamentoRepository.findByIdAndEmpresa_Id(10L, 1L))
                .thenReturn(Optional.of(pagamento));

        assertThatThrownBy(() -> service.emitir(1L, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("confirmacao");

        verify(asaasClient, never())
                .criarNotaFiscal(any(AsaasInvoiceRequest.class));
    }

    @Test
    void criaInvoiceVinculadaAoPagamentoConfirmado() {
        AssinaturaPagamento pagamento = pagamentoConfirmado();
        AssinaturaConfiguracao configuracao = configuracaoNfse();

        when(pagamentoRepository.findByIdAndEmpresa_Id(10L, 1L))
                .thenReturn(Optional.of(pagamento));
        when(notaFiscalRepository.findByPagamento_Id(10L))
                .thenReturn(Optional.empty());
        when(acessoService.buscarConfiguracao())
                .thenReturn(configuracao);
        when(asaasClient.buscarFiscalInfo())
                .thenReturn(new AsaasFiscalInfoResponse(
                        "fiscalInfo",
                        "APPROVED",
                        null,
                        null,
                        null
                ));
        when(asaasClient.criarNotaFiscal(
                any(AsaasInvoiceRequest.class)
        ))
                .thenReturn(new AsaasInvoiceResponse(
                        "invoice",
                        "inv_123",
                        "SCHEDULED",
                        "pay_123",
                        null,
                        "nfse-pagamento-10",
                        BigDecimal.TEN,
                        LocalDate.now().toString(),
                        null,
                        null,
                        null,
                        null,
                        "Licenca",
                        "0107",
                        null,
                        "Licenciamento",
                        null
                ));
        when(notaFiscalRepository.saveAndFlush(any(NotaFiscal.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.emitir(1L, 10L);

        ArgumentCaptor<AsaasInvoiceRequest> captor =
                ArgumentCaptor.forClass(AsaasInvoiceRequest.class);

        verify(asaasClient).criarNotaFiscal(captor.capture());

        assertThat(captor.getValue().payment()).isEqualTo("pay_123");
        assertThat(captor.getValue().value()).isEqualByComparingTo("10.00");
        assertThat(captor.getValue().municipalServiceCode())
                .isEqualTo("0107");
    }

    @Test
    void notaExistenteNaoCriaInvoiceDuplicada() {
        AssinaturaPagamento pagamento = pagamentoConfirmado();
        NotaFiscal notaFiscal =
                new NotaFiscal(
                        pagamento.getEmpresa(),
                        pagamento,
                        "inv_123",
                        NotaFiscalStatus.SCHEDULED,
                        pagamento.getValor(),
                        LocalDate.now(),
                        "Licenca",
                        "0107"
                );

        when(pagamentoRepository.findByIdAndEmpresa_Id(10L, 1L))
                .thenReturn(Optional.of(pagamento));
        when(notaFiscalRepository.findByPagamento_Id(10L))
                .thenReturn(Optional.of(notaFiscal));

        NotaFiscalResponse response = service.emitir(1L, 10L);

        assertThat(response.status()).isEqualTo(NotaFiscalStatus.SCHEDULED);
        verify(asaasClient, never())
                .criarNotaFiscal(any(AsaasInvoiceRequest.class));
    }

    @Test
    void webhookAutorizadoAtualizaPdfSemDuplicar() throws Exception {
        AssinaturaPagamento pagamento = pagamentoConfirmado();
        NotaFiscal notaFiscal =
                new NotaFiscal(
                        pagamento.getEmpresa(),
                        pagamento,
                        "inv_123",
                        NotaFiscalStatus.PROCESSING,
                        pagamento.getValor(),
                        LocalDate.now(),
                        "Licenca",
                        "0107"
                );

        when(notaFiscalRepository.findByAsaasInvoiceId("inv_123"))
                .thenReturn(Optional.of(notaFiscal));

        service.processarWebhook(
                "INVOICE_AUTHORIZED",
                new ObjectMapper().readTree("""
                        {
                          "id": "inv_123",
                          "status": "AUTHORIZED",
                          "number": "42",
                          "validationCode": "ABC",
                          "pdfUrl": "https://asaas.com/nota.pdf",
                          "xmlUrl": "https://asaas.com/nota.xml",
                          "authorizedDate": "2026-09-27"
                        }
                        """)
        );

        assertThat(notaFiscal.getStatus())
                .isEqualTo(NotaFiscalStatus.AUTHORIZED);
        assertThat(notaFiscal.getPdfUrl())
                .isEqualTo("https://asaas.com/nota.pdf");
        assertThat(notaFiscal.getXmlUrl())
                .isEqualTo("https://asaas.com/nota.xml");
    }

    private AssinaturaPagamento pagamentoPendente() {
        Assinatura assinatura =
                new Assinatura(
                        empresa(),
                        AssinaturaStatus.ACTIVE,
                        BigDecimal.TEN,
                        null,
                        null
                );
        ReflectionTestUtils.setField(assinatura, "id", 1L);

        AssinaturaPagamento pagamento =
                new AssinaturaPagamento(
                        assinatura,
                        "pay_123",
                        "ref",
                        "Assinatura",
                        FormaPagamentoAssinatura.PIX,
                        BigDecimal.TEN,
                        LocalDate.now(),
                        null,
                        null
                );
        ReflectionTestUtils.setField(pagamento, "id", 10L);
        return pagamento;
    }

    private AssinaturaPagamento pagamentoConfirmado() {
        AssinaturaPagamento pagamento = pagamentoPendente();
        pagamento.recebido(LocalDate.now());
        return pagamento;
    }

    private Empresa empresa() {
        Empresa empresa = new Empresa("Propriedade teste", "00000000000");
        ReflectionTestUtils.setField(empresa, "id", 1L);
        return empresa;
    }

    private AssinaturaConfiguracao configuracaoNfse() {
        AssinaturaConfiguracao configuracao =
                new AssinaturaConfiguracao();
        configuracao.atualizar(
                BigDecimal.TEN,
                true,
                15,
                7,
                5
        );
        configuracao.atualizarNfse(
                true,
                false,
                null,
                "0107",
                "Licenciamento de software",
                "Licenca {MM/AAAA}",
                "Mensalidade AgroGestao",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                false
        );
        return configuracao;
    }
}
