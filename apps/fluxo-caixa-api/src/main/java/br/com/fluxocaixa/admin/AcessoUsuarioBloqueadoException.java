package br.com.fluxocaixa.admin;

public class AcessoUsuarioBloqueadoException
        extends RuntimeException {

    public AcessoUsuarioBloqueadoException() {

        super("Seu acesso esta bloqueado. Entre em contato com o administrador");
    }
}
