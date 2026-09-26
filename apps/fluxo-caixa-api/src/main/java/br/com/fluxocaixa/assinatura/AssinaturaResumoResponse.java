package br.com.fluxocaixa.assinatura;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssinaturaResumoResponse(
        Long assinaturaId,
        Long empresaId,
        String nomeEmpresa,
        AssinaturaStatus status,
        BigDecimal valorMensal,
        LocalDate trialInicio,
        LocalDate trialFim,
        long diasRestantesTrial,
        boolean acessoLiberado,
        LocalDate proximoVencimento,
        LocalDate ultimoPagamentoEm,
        int diasAvisoTrial,
        boolean trialHabilitado,
        String tipoDocumentoPagamento,
        String documentoPagamento
) {
}
