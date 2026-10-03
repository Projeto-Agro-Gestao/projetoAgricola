package br.com.fluxocaixa.integration.asaas;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class AsaasPropertiesTest {
    private AsaasProperties config(String chave, String url, String ambiente) {
        return new AsaasProperties(chave, url, ambiente, "", 10);
    }

    @Test void selecionaUrlPeloAmbienteSemExigirDuasVariaveis() {
        assertThat(config("key", "", "PRODUCTION").urlEfetiva()).isEqualTo("https://api.asaas.com/v3");
        assertThat(config("key", null, "SANDBOX").urlEfetiva()).isEqualTo("https://api-sandbox.asaas.com/v3");
    }
    @Test void selecionaAmbientePelaChaveOuUrlQuandoNaoExplicito() {
        assertThat(config("$aact_prod_teste", "", "").ambienteEfetivo()).isEqualTo("PRODUCTION");
        assertThat(config("$aact_prod_teste", "", "").urlEfetiva()).isEqualTo("https://api.asaas.com/v3");
        assertThat(config("$aact_hmlg_teste", "", "").urlEfetiva()).isEqualTo("https://api-sandbox.asaas.com/v3");
        assertThat(config("key", "https://api.asaas.com/v3/", "").ambienteEfetivo()).isEqualTo("PRODUCTION");
    }
    @Test void rejeitaUrlEAmbienteIncompativeis() {
        assertThatThrownBy(() -> config("key", "https://api-sandbox.asaas.com/v3", "PRODUCTION").urlEfetiva())
                .isInstanceOf(AsaasException.class).hasMessageContaining("ambientes diferentes");
    }
    @Test void rejeitaChaveDeOutroAmbienteSemExporSegredo() {
        assertThatThrownBy(() -> config("$aact_prod_segredo", "", "SANDBOX").urlEfetiva())
                .isInstanceOf(AsaasException.class).hasMessageNotContaining("segredo").hasMessageContaining("outro ambiente");
    }
    @Test void naoExigeCredenciaisDuranteCriacaoDaConfiguracao() {
        assertThat(config("", "", "").possuiApiKey()).isFalse();
        assertThat(config("", "", "").urlEfetiva()).isEqualTo("https://api-sandbox.asaas.com/v3");
    }
    @Test void rejeitaUrlInseguraOuAmbienteDesconhecido() {
        assertThatThrownBy(() -> config("key", "http://api.asaas.com/v3", "PRODUCTION").urlEfetiva()).isInstanceOf(AsaasException.class);
        assertThatThrownBy(() -> config("key", "https://segredo@api.asaas.com/v3", "PRODUCTION").urlEfetiva()).hasMessageNotContaining("segredo");
        assertThatThrownBy(() -> config("key", "", "PRODCTION").urlEfetiva()).hasMessageContaining("ASAAS_ENVIRONMENT");
    }
}
