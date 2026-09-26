package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.empresa.Empresa;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AssinaturaAcessoServiceTest {

    private final AssinaturaRepository assinaturaRepository =
            mock(AssinaturaRepository.class);

    private final AssinaturaConfiguracaoRepository
            configuracaoRepository =
            mock(AssinaturaConfiguracaoRepository.class);

    private final AssinaturaAcessoService service =
            new AssinaturaAcessoService(
                    assinaturaRepository,
                    configuracaoRepository
            );

    @Test
    void trialValidoPermiteAcesso() {
        Assinatura assinatura =
                new Assinatura(
                        new Empresa("Fazenda Teste", null),
                        AssinaturaStatus.TRIAL,
                        BigDecimal.valueOf(89.90),
                        LocalDate.now(),
                        LocalDate.now().plusDays(5)
                );

        when(assinaturaRepository.findByEmpresa_Id(1L))
                .thenReturn(Optional.of(assinatura));
        when(configuracaoRepository.findAll())
                .thenReturn(List.of(configuracao()));

        assertThat(service.podeAcessarAreaProtegida(1L))
                .isTrue();
    }

    @Test
    void trialExpiradoBloqueiaAreaProtegida() {
        Assinatura assinatura =
                new Assinatura(
                        new Empresa("Fazenda Teste", null),
                        AssinaturaStatus.TRIAL,
                        BigDecimal.valueOf(89.90),
                        LocalDate.now().minusDays(20),
                        LocalDate.now().minusDays(1)
                );

        when(assinaturaRepository.findByEmpresa_Id(1L))
                .thenReturn(Optional.of(assinatura));
        when(configuracaoRepository.findAll())
                .thenReturn(List.of(configuracao()));

        assertThat(service.podeAcessarAreaProtegida(1L))
                .isFalse();
    }

    @Test
    void assinaturaAtivaPermiteAcesso() {
        Assinatura assinatura =
                new Assinatura(
                        new Empresa("Fazenda Teste", null),
                        AssinaturaStatus.PENDING,
                        BigDecimal.valueOf(89.90),
                        null,
                        null
                );

        assinatura.ativar(LocalDate.now());

        when(assinaturaRepository.findByEmpresa_Id(1L))
                .thenReturn(Optional.of(assinatura));
        when(configuracaoRepository.findAll())
                .thenReturn(List.of(configuracao()));

        assertThat(service.podeAcessarAreaProtegida(1L))
                .isTrue();
    }

    private AssinaturaConfiguracao configuracao() {
        AssinaturaConfiguracao configuracao =
                new AssinaturaConfiguracao();
        configuracao.atualizar(
                BigDecimal.valueOf(89.90),
                true,
                15,
                7,
                3
        );
        return configuracao;
    }
}
