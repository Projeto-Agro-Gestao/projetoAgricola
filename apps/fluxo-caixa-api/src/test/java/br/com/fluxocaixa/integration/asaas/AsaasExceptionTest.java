package br.com.fluxocaixa.integration.asaas;

import br.com.fluxocaixa.comum.erro.ManipuladorGlobalDeErros;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.assertj.core.api.Assertions.*;

class AsaasExceptionTest {
    @Test void interpretaCodigoEstruturadoSemConfundirDescricao() {
        AsaasException erro = new AsaasException("HTTP 400", 400,
                "{\"errors\":[{\"code\" : \"invalid_customer\", \"description\":\"invalid_value\"}]}");
        assertThat(erro.contemCodigo("invalid_customer")).isTrue();
        assertThat(erro.contemCodigo("invalid_value")).isFalse();
    }
    @Test void naoDevolveDescricaoBrutaNemSegredos() {
        AsaasException erro = new AsaasException("HTTP 400", 400,
                "{\"errors\":[{\"code\":\"invalid_value\",\"description\":\"cpf segredo pessoal\"}]}");
        assertThat(erro.mensagemParaUsuario()).contains("valor").doesNotContain("segredo", "pessoal");
        assertThat(new AsaasException("HTTP 500", 500, "<html>segredo</html>").mensagemParaUsuario())
                .contains("indisponivel").doesNotContain("segredo");
    }
    @Test void credencialDoAsaasNaoVira401DaSessaoAgrogestao() {
        var resposta = new ManipuladorGlobalDeErros().tratarErroAsaas(
                new AsaasException("HTTP 401", 401, ""), new MockHttpServletRequest());
        assertThat(resposta.getStatusCode().value()).isEqualTo(502);
        assertThat(new AsaasException("HTTP 403", 403, "").mensagemParaUsuario()).contains("permissoes");
    }
    @Test void dadosInvalidosELimitePossuemStatusControlado() {
        var handler = new ManipuladorGlobalDeErros();
        assertThat(handler.tratarErroAsaas(new AsaasException("HTTP 400", 400, "{}"), new MockHttpServletRequest())
                .getStatusCode().value()).isEqualTo(422);
        assertThat(handler.tratarErroAsaas(new AsaasException("HTTP 429", 429, "{}"), new MockHttpServletRequest())
                .getStatusCode().value()).isEqualTo(503);
    }
}
