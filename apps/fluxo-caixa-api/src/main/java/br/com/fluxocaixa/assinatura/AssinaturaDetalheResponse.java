package br.com.fluxocaixa.assinatura;

import java.util.List;

public record AssinaturaDetalheResponse(
        AssinaturaResumoResponse resumo,
        List<AssinaturaPagamentoResponse> pagamentos
) {
}
