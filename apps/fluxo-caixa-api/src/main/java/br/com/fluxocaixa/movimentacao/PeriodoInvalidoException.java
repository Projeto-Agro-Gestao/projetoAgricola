package br.com.fluxocaixa.movimentacao;

public class PeriodoInvalidoException extends RuntimeException {

    public PeriodoInvalidoException() {
        super(
                "A data inicial não pode estar depois da data final"
        );
    }
}