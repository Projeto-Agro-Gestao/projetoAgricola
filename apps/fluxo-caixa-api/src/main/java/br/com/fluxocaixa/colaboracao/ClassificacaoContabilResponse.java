package br.com.fluxocaixa.colaboracao;

public record ClassificacaoContabilResponse(
        Long id,
        String nome,
        String descricao,
        boolean ativa) {

    public static ClassificacaoContabilResponse de(
            ClassificacaoContabil classificacao) {

        return new ClassificacaoContabilResponse(
                classificacao.getId(),
                classificacao.getNome(),
                classificacao.getDescricao(),
                classificacao.isAtiva()
        );
    }
}
