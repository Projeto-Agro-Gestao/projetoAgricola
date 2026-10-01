package br.com.fluxocaixa.assinatura;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CepLookupServiceTest {

    @Test
    void deveRetornarEnderecoQuandoCepExiste() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server =
                MockRestServiceServer.bindTo(builder).build();
        CepLookupService service = new CepLookupService(builder);

        server.expect(requestTo("https://viacep.com.br/ws/88813600/json/"))
                .andRespond(withSuccess(
                        """
                        {
                          "cep": "88813-600",
                          "logradouro": "Rua Teste",
                          "bairro": "Centro",
                          "localidade": "Criciuma",
                          "uf": "SC"
                        }
                        """,
                        MediaType.APPLICATION_JSON
                ));

        CepConsultaResponse response = service.consultar("88813-600");

        assertThat(response.cep()).isEqualTo("88813600");
        assertThat(response.logradouro()).isEqualTo("Rua Teste");
        assertThat(response.bairro()).isEqualTo("Centro");
        assertThat(response.cidade()).isEqualTo("Criciuma");
        assertThat(response.uf()).isEqualTo("SC");
        assertThat(response.provider()).isEqualTo("ViaCEP");
        server.verify();
    }

    @Test
    void deveRetornarMensagemQuandoCepNaoExiste() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server =
                MockRestServiceServer.bindTo(builder).build();
        CepLookupService service = new CepLookupService(builder);

        server.expect(requestTo("https://viacep.com.br/ws/99999999/json/"))
                .andRespond(withSuccess(
                        "{\"erro\": true}",
                        MediaType.APPLICATION_JSON
                ));

        CepConsultaResponse response = service.consultar("99999999");

        assertThat(response.logradouro()).isNull();
        assertThat(response.mensagem()).isEqualTo("CEP nao encontrado.");
        server.verify();
    }

    @Test
    void indisponibilidadeExternaNaoDerrubaConsulta() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server =
                MockRestServiceServer.bindTo(builder).build();
        CepLookupService service = new CepLookupService(builder);

        server.expect(requestTo("https://viacep.com.br/ws/88813600/json/"))
                .andRespond(withServerError());

        CepConsultaResponse response = service.consultar("88813600");

        assertThat(response.logradouro()).isNull();
        assertThat(response.mensagem())
                .contains("Preencha o endereco manualmente");
        server.verify();
    }

    @Test
    void deveRejeitarCepInvalido() {
        CepLookupService service =
                new CepLookupService(RestClient.builder());

        assertThatThrownBy(() -> service.consultar("123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CEP deve possuir 8 digitos");
    }
}
