package br.com.fluxocaixa.colaboracao;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DocumentoUploadValidatorTest {
    @Test
    void pdfTemTipoDetectadoENomeSemCaminhoOuControle() {
        var result = DocumentoUploadValidator.validar(arquivo("../../nota\r\n.pdf", "text/html", "%PDF-1.7\n"));
        assertThat(result.tipoConteudo()).isEqualTo("application/pdf");
        assertThat(result.nome()).isEqualTo("nota__.pdf");
    }

    @Test
    void naoAceitaHtmlExecutavelOuPdfFalso() {
        for (String nome : new String[]{"arquivo.html", "arquivo.svg", "arquivo.exe", "arquivo.pdf"}) {
            assertThatThrownBy(() -> DocumentoUploadValidator.validar(arquivo(nome, "application/pdf", "<script>alert(1)</script>")))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void xmlFiscalSemEntidadesExternasEPermitido() {
        assertThat(DocumentoUploadValidator.validar(arquivo("nota.xml", "application/xml", "<NFe><valor>10</valor></NFe>"))
                .tipoConteudo()).isEqualTo("application/xml");
    }

    @Test
    void xmlComDoctypeOuEntidadeExternaERecusado() {
        assertThatThrownBy(() -> DocumentoUploadValidator.validar(arquivo("nota.xml", "application/xml",
                "<!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><foo>&xxe;</foo>")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("recursos externos");
    }

    @Test
    void xmlMalformadoNaoEArmazenado() {
        assertThatThrownBy(() -> DocumentoUploadValidator.validar(arquivo("nota.xml", "application/xml", "<NFe>")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void imagemValidaAceitaETrocaDeExtensaoERecusada() throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", bytes);
        assertThat(DocumentoUploadValidator.validar(new MockMultipartFile("arquivo", "nota.png", "image/png", bytes.toByteArray()))
                .tipoConteudo()).isEqualTo("image/png");
        assertThatThrownBy(() -> DocumentoUploadValidator.validar(new MockMultipartFile("arquivo", "nota.jpg", "image/jpeg", bytes.toByteArray())))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void arquivoGrandeERecusadoAntesDeLerConteudo() {
        MultipartFile arquivo = mock(MultipartFile.class);
        when(arquivo.isEmpty()).thenReturn(false);
        when(arquivo.getSize()).thenReturn(11L * 1024 * 1024);
        assertThatThrownBy(() -> DocumentoUploadValidator.validar(arquivo))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("10 MB");
    }

    private MockMultipartFile arquivo(String nome, String tipo, String conteudo) {
        return new MockMultipartFile("arquivo", nome, tipo, conteudo.getBytes(StandardCharsets.UTF_8));
    }
}
