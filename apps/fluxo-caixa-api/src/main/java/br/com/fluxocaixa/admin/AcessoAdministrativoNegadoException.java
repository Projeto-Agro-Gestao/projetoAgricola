package br.com.fluxocaixa.admin;

public class AcessoAdministrativoNegadoException
        extends RuntimeException {

    public AcessoAdministrativoNegadoException() {

        super("Apenas administradores podem acessar esta area");
    }
}
