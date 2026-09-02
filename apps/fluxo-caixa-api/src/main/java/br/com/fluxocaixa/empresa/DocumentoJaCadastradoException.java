package br.com.fluxocaixa.empresa;

public class DocumentoJaCadastradoException extends RuntimeException {

    public DocumentoJaCadastradoException(String documento) {
        super("Já existe uma empresa cadastrada com o documento " + documento);
    }
}