package br.com.fluxocaixa.autenticacao;

public class CredenciaisInvalidasException
        extends RuntimeException {

    public CredenciaisInvalidasException() {

        super("E-mail ou senha inválidos");
    }
}