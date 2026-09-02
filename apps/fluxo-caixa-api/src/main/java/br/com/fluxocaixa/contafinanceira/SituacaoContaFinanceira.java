package br.com.fluxocaixa.contafinanceira;

public enum SituacaoContaFinanceira {

    PENDENTE(
            "Pendente",
            "A conta ainda não foi paga ou recebida"
    ),

    PARCIAL(
            "Parcialmente quitada",
            "Uma parte do valor já foi paga ou recebida"
    ),

    QUITADA(
            "Quitada",
            "O valor total já foi pago ou recebido"
    ),

    CANCELADA(
            "Cancelada",
            "A conta foi cancelada e não entra na previsão"
    );

    private final String descricao;
    private final String explicacao;

    SituacaoContaFinanceira(
            String descricao,
            String explicacao) {

        this.descricao = descricao;
        this.explicacao = explicacao;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getExplicacao() {
        return explicacao;
    }
}