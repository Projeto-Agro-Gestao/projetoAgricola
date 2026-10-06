package br.com.fluxocaixa.refreshtoken;

public class RefreshTokenInvalidoException
        extends RuntimeException {

    public RefreshTokenInvalidoException() {
        super(
                "A sessão expirou. "
                        + "Faça login novamente."
        );
    }
}
