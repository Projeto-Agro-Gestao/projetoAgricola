package br.com.fluxocaixa.usuario;

public class EmailJaCadastradoException
        extends RuntimeException {

    public EmailJaCadastradoException() {

        super(
                "Já existe uma conta cadastrada com este e-mail"
        );
    }
}