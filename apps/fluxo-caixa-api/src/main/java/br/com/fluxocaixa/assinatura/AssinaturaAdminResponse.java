package br.com.fluxocaixa.assinatura;

import java.util.List;

public record AssinaturaAdminResponse(
        AssinaturaConfiguracaoResponse configuracao,
        List<AssinaturaAdminClienteResponse> clientes
) {
}
