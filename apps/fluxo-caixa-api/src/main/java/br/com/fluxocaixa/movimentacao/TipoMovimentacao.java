package br.com.fluxocaixa.movimentacao;

public enum TipoMovimentacao {

    RECEITA("Entrou dinheiro"),
    DESPESA("Saiu dinheiro");

    private final String descricao;

    TipoMovimentacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}