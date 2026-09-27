package br.com.fluxocaixa.assinatura;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class AssinaturaVencimentoTest {

    @Test
    void preservaDiaFixoQuandoPagamentoFoiAtrasado() {
        LocalDate proximo =
                Assinatura.calcularProximoVencimentoDepoisDe(
                        LocalDate.of(2026, 10, 10),
                        10
                );

        assertThat(proximo)
                .isEqualTo(LocalDate.of(2026, 11, 10));
    }

    @Test
    void usaUltimoDiaValidoEmFevereiroNaoBissexto() {
        LocalDate proximo =
                Assinatura.calcularProximoVencimentoDepoisDe(
                        LocalDate.of(2027, 1, 31),
                        31
                );

        assertThat(proximo)
                .isEqualTo(LocalDate.of(2027, 2, 28));
    }

    @Test
    void usaUltimoDiaValidoEmFevereiroBissexto() {
        LocalDate proximo =
                Assinatura.calcularProximoVencimentoDepoisDe(
                        LocalDate.of(2028, 1, 31),
                        31
                );

        assertThat(proximo)
                .isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    void preservaViradaDeAnoComDiaFixo() {
        LocalDate proximo =
                Assinatura.calcularProximoVencimentoDepoisDe(
                        LocalDate.of(2026, 12, 5),
                        5
                );

        assertThat(proximo)
                .isEqualTo(LocalDate.of(2027, 1, 5));
    }
}
