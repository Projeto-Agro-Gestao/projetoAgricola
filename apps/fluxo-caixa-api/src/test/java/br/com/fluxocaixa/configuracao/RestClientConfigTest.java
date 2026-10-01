package br.com.fluxocaixa.configuracao;

import br.com.fluxocaixa.fornecedor.FornecedorController;
import br.com.fluxocaixa.fornecedor.FornecedorRelatorioService;
import br.com.fluxocaixa.fornecedor.FornecedorService;
import br.com.fluxocaixa.fornecedor.ReceitaFederalCnpjService;
import br.com.fluxocaixa.integracaooficial.DisabledCnpjProvider;
import br.com.fluxocaixa.integracaooficial.OfficialCnpjCacheRepository;
import br.com.fluxocaixa.integracaooficial.OfficialCnpjService;
import br.com.fluxocaixa.integracaooficial.OfficialIntegrationException;
import br.com.fluxocaixa.integracaooficial.OfficialIntegrationProperties;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.List;

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
                new ReceitaFederalCnpjService(criarOfficialCnpjService());

        assertThat(service).isNotNull();
    }

    @Test
    void deveCriarFornecedorControllerComServicoCnpj() {
        ReceitaFederalCnpjService cnpjService =
                new ReceitaFederalCnpjService(criarOfficialCnpjService());

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
                new ReceitaFederalCnpjService(criarOfficialCnpjService());

        assertThatThrownBy(() -> service.consultar("11222333000181"))
                .isInstanceOf(OfficialIntegrationException.class)
                .hasMessageContaining("nao configurada");
    }

    private OfficialCnpjService criarOfficialCnpjService() {
        return new OfficialCnpjService(
                new OfficialIntegrationProperties(),
                mock(OfficialCnpjCacheRepository.class),
                List.of(new DisabledCnpjProvider())
        );
    }
}
