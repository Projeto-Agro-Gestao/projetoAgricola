package br.com.fluxocaixa.recuperacaosenha;

public class TokenRecuperacaoSenhaInvalidoException
        extends RuntimeException {

    public TokenRecuperacaoSenhaInvalidoException() {
        super(
                "O link de recuperação de senha "
                        + "é inválido ou expirou."
        );
    }
}