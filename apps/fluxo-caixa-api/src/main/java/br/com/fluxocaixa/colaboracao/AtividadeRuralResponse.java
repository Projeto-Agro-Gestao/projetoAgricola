package br.com.fluxocaixa.colaboracao;

public record AtividadeRuralResponse(
        Long id,
        String nome,
        TipoAtividadeRural tipo
) {
    public static AtividadeRuralResponse de(
            AtividadeRural atividade) {
        return new AtividadeRuralResponse(
                atividade.getId(),
                atividade.getNome(),
                atividade.getTipo()
        );
    }
}
