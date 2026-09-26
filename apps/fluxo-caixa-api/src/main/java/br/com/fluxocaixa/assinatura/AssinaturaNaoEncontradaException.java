package br.com.fluxocaixa.assinatura;

public class AssinaturaNaoEncontradaException extends RuntimeException {

    public AssinaturaNaoEncontradaException() {
        super("Assinatura nao encontrada");
    }
}
