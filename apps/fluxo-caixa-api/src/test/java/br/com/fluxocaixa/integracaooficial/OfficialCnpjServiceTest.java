package br.com.fluxocaixa.integracaooficial;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OfficialCnpjServiceTest {

    @Test
    void cnpjInvalidoNaoChamaProvider() {
        OfficialCnpjProvider provider = mock(OfficialCnpjProvider.class);
        when(provider.tipo()).thenReturn(OfficialCnpjProviderType.SERPRO);

        OfficialCnpjCacheRepository cacheRepository =
                mock(OfficialCnpjCacheRepository.class);
        OfficialIntegrationProperties properties =
                new OfficialIntegrationProperties();
        properties.getCnpj().setProvider(OfficialCnpjProviderType.SERPRO);

        OfficialCnpjService service = new OfficialCnpjService(
                properties,
                cacheRepository,
                List.of(provider, new DisabledCnpjProvider())
        );

        assertThatThrownBy(() -> service.consultar("00.000.000/0000-00"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("CNPJ invalido.");

        verify(provider, never()).consultar(any());
        verify(cacheRepository, never()).save(any());
    }

    @Test
    void providerDisabledPermiteStartupMasNaoConsulta() {
        OfficialCnpjService service = new OfficialCnpjService(
                new OfficialIntegrationProperties(),
                mock(OfficialCnpjCacheRepository.class),
                List.of(new DisabledCnpjProvider())
        );

        assertThat(service.status().status())
                .isEqualTo(OfficialIntegrationStatus.NAO_CONFIGURADO);
        assertThatThrownBy(() -> service.consultar("11222333000181"))
                .isInstanceOf(OfficialIntegrationException.class)
                .hasMessageContaining("nao configurada");
    }

    @Test
    void consultaUsaCacheValidoAntesDeProviderExterno() {
        OfficialCnpjProvider provider = mock(OfficialCnpjProvider.class);
        when(provider.tipo()).thenReturn(OfficialCnpjProviderType.SERPRO);

        CnpjOfficialDataResponse dados = new CnpjOfficialDataResponse(
                "11222333000181",
                "Empresa Teste Ltda",
                "Empresa Teste",
                "ATIVA",
                null,
                null,
                null,
                null,
                List.of(),
                "Rua Central",
                "10",
                null,
                "Centro",
                "01001000",
                "Sao Paulo",
                "SP",
                OfficialCnpjProviderType.SERPRO,
                "SERPRO",
                LocalDateTime.now(),
                false
        );

        OfficialCnpjCache cache = new OfficialCnpjCache(dados);
        OfficialCnpjCacheRepository cacheRepository =
                mock(OfficialCnpjCacheRepository.class);
        when(cacheRepository.findFirstByCnpjAndProviderOrderByConsultadoEmDesc(
                "11222333000181",
                OfficialCnpjProviderType.SERPRO
        )).thenReturn(Optional.of(cache));

        OfficialIntegrationProperties properties =
                new OfficialIntegrationProperties();
        properties.getCnpj().setProvider(OfficialCnpjProviderType.SERPRO);

        OfficialCnpjService service = new OfficialCnpjService(
                properties,
                cacheRepository,
                List.of(provider, new DisabledCnpjProvider())
        );

        CnpjOfficialDataResponse response =
                service.consultar("11.222.333/0001-81");

        assertThat(response.cache()).isTrue();
        assertThat(response.razaoSocial()).isEqualTo("Empresa Teste Ltda");
        verify(provider, never()).consultar(any());
    }
}
