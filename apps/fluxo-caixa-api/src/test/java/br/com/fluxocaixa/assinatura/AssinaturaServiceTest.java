package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.integration.asaas.AsaasBoletoLinhaResponse;
import br.com.fluxocaixa.integration.asaas.AsaasClient;
import br.com.fluxocaixa.integration.asaas.AsaasCustomerRequest;
import br.com.fluxocaixa.integration.asaas.AsaasCustomerResponse;
import br.com.fluxocaixa.integration.asaas.AsaasException;
import br.com.fluxocaixa.integration.asaas.AsaasPaymentRequest;
import br.com.fluxocaixa.integration.asaas.AsaasPaymentResponse;
import br.com.fluxocaixa.integration.asaas.AsaasPixQrCodeResponse;
import br.com.fluxocaixa.integration.asaas.AsaasProperties;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssinaturaServiceTest {

    private final AssinaturaRepository assinaturaRepository =
            mock(AssinaturaRepository.class);
    private final AssinaturaConfiguracaoRepository configuracaoRepository =
            mock(AssinaturaConfiguracaoRepository.class);
    private final AssinaturaPagamentoRepository pagamentoRepository =
            mock(AssinaturaPagamentoRepository.class);
    private final EmpresaRepository empresaRepository =
            mock(EmpresaRepository.class);
    private final CategoriaRepository categoriaRepository =
            mock(CategoriaRepository.class);
    private final MovimentacaoRepository movimentacaoRepository =
            mock(MovimentacaoRepository.class);
    private final AsaasClient asaasClient =
            mock(AsaasClient.class);
    private final AssinaturaAcessoService acessoService =
            mock(AssinaturaAcessoService.class);
    private final UsuarioRepository usuarioRepository =
            mock(UsuarioRepository.class);

    @Test
    void criaNovoCustomerQuandoAmbienteNaoCorrespondeNoBoleto() {
        Assinatura assinatura =
                assinaturaComCustomer("cus_sandbox", "SANDBOX");
        configurarDependenciasBasicas(assinatura);

        when(asaasClient.criarCliente(any(AsaasCustomerRequest.class)))
                .thenReturn(customer("cus_producao"));
        when(asaasClient.criarPagamento(any(AsaasPaymentRequest.class)))
                .thenReturn(payment(
                        "pay_boleto",
                        "BOLETO",
                        "https://sandbox.asaas.com/b/pdf/pay_boleto"
                ));
        when(asaasClient.buscarLinhaDigitavel("pay_boleto"))
                .thenReturn(new AsaasBoletoLinhaResponse("linha"));

        AssinaturaService service =
                serviceComAmbiente("PRODUCTION");

        service.criarBoleto(1L);

        ArgumentCaptor<AsaasPaymentRequest> captor =
                ArgumentCaptor.forClass(AsaasPaymentRequest.class);
        verify(asaasClient).criarPagamento(captor.capture());

        assertThat(captor.getValue().customer())
                .isEqualTo("cus_producao");
        assertThat(assinatura.getAsaasCustomerId())
                .isEqualTo("cus_producao");
        assertThat(assinatura.getAsaasCustomerEnvironment())
                .isEqualTo("PRODUCTION");
    }

    @Test
    void recriaCustomerUmaVezQuandoPixRecebeInvalidCustomer() {
        Assinatura assinatura =
                assinaturaComCustomer("cus_invalido", "PRODUCTION");
        configurarDependenciasBasicas(assinatura);

        when(asaasClient.criarCliente(any(AsaasCustomerRequest.class)))
                .thenReturn(customer("cus_producao_novo"));
        when(asaasClient.criarPagamento(any(AsaasPaymentRequest.class)))
                .thenThrow(new AsaasException(
                        "Asaas retornou erro HTTP 400",
                        400,
                        """
                        {"errors":[{"code":"invalid_customer"}]}
                        """
                ))
                .thenReturn(payment("pay_pix", "PIX", null));
        when(asaasClient.buscarPixQrCode("pay_pix"))
                .thenReturn(new AsaasPixQrCodeResponse(
                        "qr",
                        "pix-copia-e-cola",
                        "2026-09-29 23:59:59"
                ));

        AssinaturaService service =
                serviceComAmbiente("PRODUCTION");

        service.criarPix(1L);

        ArgumentCaptor<AsaasPaymentRequest> captor =
                ArgumentCaptor.forClass(AsaasPaymentRequest.class);
        verify(asaasClient, times(2)).criarPagamento(captor.capture());

        assertThat(captor.getAllValues().get(0).customer())
                .isEqualTo("cus_invalido");
        assertThat(captor.getAllValues().get(1).customer())
                .isEqualTo("cus_producao_novo");
        assertThat(assinatura.getAsaasCustomerId())
                .isEqualTo("cus_producao_novo");
        assertThat(assinatura.getAsaasCustomerEnvironment())
                .isEqualTo("PRODUCTION");
    }

    private Assinatura assinaturaComCustomer(
            String customerId,
            String ambiente) {

        Assinatura assinatura =
                new Assinatura(
                        new Empresa(
                                "Propriedade teste",
                                "00000000000"
                        ),
                        AssinaturaStatus.ACTIVE,
                        BigDecimal.valueOf(89.90),
                        null,
                        null
                );
        assinatura.definirAsaasCustomer(customerId, ambiente);
        return assinatura;
    }

    private void configurarDependenciasBasicas(
            Assinatura assinatura) {

        AssinaturaConfiguracao configuracao =
                new AssinaturaConfiguracao();
        configuracao.atualizar(
                BigDecimal.valueOf(89.90),
                true,
                15,
                7,
                3
        );

        when(assinaturaRepository.findByEmpresa_Id(1L))
                .thenReturn(Optional.of(assinatura));
        when(acessoService.buscarConfiguracao())
                .thenReturn(configuracao);
        when(pagamentoRepository.save(any(AssinaturaPagamento.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(pagamentoRepository.saveAndFlush(
                any(AssinaturaPagamento.class)
        ))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private AssinaturaService serviceComAmbiente(String ambiente) {
        return new AssinaturaService(
                assinaturaRepository,
                configuracaoRepository,
                pagamentoRepository,
                empresaRepository,
                categoriaRepository,
                movimentacaoRepository,
                asaasClient,
                new AsaasProperties(
                        "key",
                        "https://api.asaas.com/v3",
                        ambiente,
                        "",
                        10
                ),
                acessoService,
                usuarioRepository
        );
    }

    private AsaasCustomerResponse customer(String id) {
        return new AsaasCustomerResponse(
                "customer",
                id,
                "Propriedade teste",
                null,
                "00000000000",
                "empresa-1"
        );
    }

    private AsaasPaymentResponse payment(
            String id,
            String forma,
            String bankSlipUrl) {

        return new AsaasPaymentResponse(
                id,
                "PENDING",
                forma,
                BigDecimal.valueOf(89.90),
                LocalDate.now().plusDays(3).toString(),
                "https://sandbox.asaas.com/i/" + id,
                bankSlipUrl,
                "assinatura-1"
        );
    }
}
