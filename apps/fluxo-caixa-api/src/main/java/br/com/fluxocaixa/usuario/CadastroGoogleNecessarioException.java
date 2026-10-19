package br.com.fluxocaixa.usuario;

public class CadastroGoogleNecessarioException extends RuntimeException {

    public CadastroGoogleNecessarioException() {
        super("Complete os dados da propriedade para criar sua conta.");
    }
}
