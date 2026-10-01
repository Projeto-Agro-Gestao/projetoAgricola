package br.com.fluxocaixa.integracaooficial;

public record OfficialIntegrationRequirementResponse(
        String chave,
        String descricao,
        boolean obrigatorio,
        boolean configurado,
        boolean segredo
) {
}
