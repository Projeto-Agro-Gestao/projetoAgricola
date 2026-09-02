package br.com.fluxocaixa.empresa;

public class EmpresaNaoEncontradaException extends RuntimeException {

    public EmpresaNaoEncontradaException(Long empresaId) {
        super("Não foi possível encontrar a empresa de número " + empresaId);
    }
}