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
        Integer diaVencimento,
        LocalDate fimCarencia,
        LocalDate dataBloqueio,
        long diasRestantesCarencia,
        int diasAvisoTrial,
        boolean trialHabilitado,
        int intervaloAlertaMinutos,
        boolean pixHabilitado,
        boolean boletoHabilitado,
        int diasAvisoVencimento,
        String tipoDocumentoPagamento,
        String documentoPagamento
) {
}
