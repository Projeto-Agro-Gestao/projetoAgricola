package br.com.fluxocaixa.categoria;

public enum AreaCategoria {

    GERAL("Geral"),
    AGRICULTURA("Agricultura"),
    PECUARIA("Pecuaria");

    private final String descricao;

    AreaCategoria(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
