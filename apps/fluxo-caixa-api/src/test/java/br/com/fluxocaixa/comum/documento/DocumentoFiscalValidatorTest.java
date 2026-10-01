package br.com.fluxocaixa.comum.documento;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentoFiscalValidatorTest {

    @Test
    void deveValidarCpfComOuSemMascara() {
        assertThat(
                DocumentoFiscalValidator.cpfValido("529.982.247-25")
        ).isTrue();
        assertThat(
                DocumentoFiscalValidator.cpfValido("52998224725")
        ).isTrue();
    }

    @Test
    void deveRejeitarCpfInvalido() {
        assertThat(
                DocumentoFiscalValidator.cpfValido("529.982.247-24")
        ).isFalse();
        assertThat(
                DocumentoFiscalValidator.cpfValido("111.111.111-11")
        ).isFalse();
        assertThat(DocumentoFiscalValidator.cpfValido(null)).isFalse();
        assertThat(DocumentoFiscalValidator.cpfValido("")).isFalse();
        assertThat(DocumentoFiscalValidator.cpfValido("123")).isFalse();
    }

    @Test
    void deveValidarCnpjComOuSemMascara() {
        assertThat(
                DocumentoFiscalValidator.cnpjValido("11.222.333/0001-81")
        ).isTrue();
        assertThat(
                DocumentoFiscalValidator.cnpjValido("11222333000181")
        ).isTrue();
    }

    @Test
    void deveRejeitarCnpjInvalido() {
        assertThat(
                DocumentoFiscalValidator.cnpjValido("11.222.333/0001-82")
        ).isFalse();
        assertThat(
                DocumentoFiscalValidator.cnpjValido("00.000.000/0000-00")
        ).isFalse();
        assertThat(DocumentoFiscalValidator.cnpjValido(null)).isFalse();
        assertThat(DocumentoFiscalValidator.cnpjValido("")).isFalse();
        assertThat(DocumentoFiscalValidator.cnpjValido("123")).isFalse();
    }
}
