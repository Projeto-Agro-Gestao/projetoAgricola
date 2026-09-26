package br.com.fluxocaixa.assinatura;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssinaturaAdminClienteResponse(
        Long usuarioId,
        Long empresaId,
        String cliente,
        String empresa,
        String email,
        String plano,
        BigDecimal valor,
        AssinaturaStatus statusAssinatura,
        LocalDate trialInicio,
        LocalDate trialFim,
        long diasRestantesTrial,
        LocalDate proximoVencimento,
        LocalDate ultimoPagamento,
        String formaUltimoPagamento
) {
}
