package br.com.fluxocaixa.colaboracao;

import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public final class DocumentoUploadValidator {
    private static final long MAX_BYTES = 10 * 1024 * 1024;
    public record Arquivo(String nome, String tipoConteudo, byte[] conteudo) { }

    private DocumentoUploadValidator() { }

    public static Arquivo validar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) throw new IllegalArgumentException("Informe um arquivo para enviar.");
        if (arquivo.getSize() > MAX_BYTES) throw new IllegalArgumentException("Documento deve ter no maximo 10 MB.");
        String nome = arquivo.getOriginalFilename();
        if (nome == null) throw new IllegalArgumentException("Informe o nome do arquivo.");
        nome = nome.replace('\\', '/');
        nome = nome.substring(nome.lastIndexOf('/') + 1)
                .replaceAll("[\\p{Cntrl}:]", "_");
        if (nome.length() > 200) throw new IllegalArgumentException("Nome do arquivo muito longo.");
        String extensao = nome.substring(nome.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        try {
            byte[] bytes = arquivo.getBytes();
            if (bytes.length > MAX_BYTES) throw new IllegalArgumentException("Documento deve ter no maximo 10 MB.");
            String mime = switch (extensao) {
                case "pdf" -> {
                    if (bytes.length < 5 || !new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) {
                        throw new IllegalArgumentException("Conteudo do PDF invalido.");
                    }
                    yield "application/pdf";
                }
                case "xml" -> {
                    validarXml(bytes);
                    yield "application/xml";
                }
                case "png", "jpg", "jpeg" -> {
                    try (var stream = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                        var leitores = ImageIO.getImageReaders(stream);
                        if (!leitores.hasNext()) throw new IllegalArgumentException("Imagem invalida.");
                        var leitor = leitores.next();
                        try {
                            leitor.setInput(stream);
                            String formato = leitor.getFormatName().toLowerCase(Locale.ROOT);
                            boolean png = extensao.equals("png");
                            if (!(png ? formato.equals("png") : formato.equals("jpeg"))
                                    || (long) leitor.getWidth(0) * leitor.getHeight(0) > 40000000L) {
                                throw new IllegalArgumentException("Formato ou dimensoes da imagem invalidos.");
                            }
                            yield png ? "image/png" : "image/jpeg";
                        } finally { leitor.dispose(); }
                    }
                }
                default -> throw new IllegalArgumentException("Envie PDF, XML, PNG ou JPEG.");
            };
            return new Arquivo(nome, mime, bytes);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Nao foi possivel validar o documento.");
        }
    }

    private static void validarXml(byte[] bytes) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            var builder = factory.newDocumentBuilder();
            builder.setErrorHandler(new DefaultHandler() {
                @Override public void error(org.xml.sax.SAXParseException e) throws SAXException { throw e; }
                @Override public void fatalError(org.xml.sax.SAXParseException e) throws SAXException { throw e; }
            });
            builder.parse(new InputSource(new ByteArrayInputStream(bytes)));
        } catch (Exception exception) {
            throw new IllegalArgumentException("XML invalido ou com recursos externos nao permitidos.");
        }
    }
}
