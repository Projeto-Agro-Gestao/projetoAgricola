package br.com.fluxocaixa.contafinanceira;

public enum TipoContaFinanceira {

    PAGAR(
            "Conta a pagar",
            "Dinheiro que deverá sair"
    ),

    RECEBER(
            "Conta a receber",
            "Dinheiro que deverá entrar"
    );

    private final String descricao;
    private final String explicacao;

    TipoContaFinanceira(
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