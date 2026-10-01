package br.com.fluxocaixa.configuracao;

import br.com.fluxocaixa.fornecedor.ConsultaCnpjIndisponivelException;
import br.com.fluxocaixa.fornecedor.FornecedorController;
import br.com.fluxocaixa.fornecedor.FornecedorRelatorioService;
import br.com.fluxocaixa.fornecedor.FornecedorService;
import br.com.fluxocaixa.fornecedor.ReceitaFederalCnpjService;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class RestClientConfigTest {

    @Test
    void deveCriarRestClientBuilder() {
        RestClient.Builder builder =
                new RestClientConfig()
                        .restClientBuilder();

        assertThat(builder).isNotNull();
        assertThat(builder.build()).isNotNull();
    }

    @Test
    void deveCriarServicoReceitaFederalSemChamadaExternaNoConstrutor() {
        ReceitaFederalCnpjService service =
                new ReceitaFederalCnpjService(
                        new RestClientConfig()
                                .restClientBuilder(),
                        "",
                        ""
                );

        assertThat(service).isNotNull();
    }

    @Test
    void deveCriarFornecedorControllerComServicoCnpj() {
        ReceitaFederalCnpjService cnpjService =
                new ReceitaFederalCnpjService(
                        new RestClientConfig()
                                .restClientBuilder(),
                        "",
                        ""
                );

        FornecedorController controller =
                new FornecedorController(
                        mock(FornecedorService.class),
                        mock(FornecedorRelatorioService.class),
                        cnpjService
                );

        assertThat(controller).isNotNull();
    }

    @Test
    void indisponibilidadeExternaNaoImpedeCriacaoDoServico() {
        ReceitaFederalCnpjService service =
                new ReceitaFederalCnpjService(
                        new RestClientConfig()
                                .restClientBuilder(),
                        "http://127.0.0.1:1",
                        ""
                );

        assertThatThrownBy(() -> service.consultar("12345678000190"))
                .isInstanceOf(ConsultaCnpjIndisponivelException.class)
                .hasMessageContaining("Consulta de CNPJ indisponivel");
    }
}
