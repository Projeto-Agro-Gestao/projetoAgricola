package br.com.fluxocaixa.assinatura;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class AssinaturaAcessoService {

    private final AssinaturaRepository assinaturaRepository;
    private final AssinaturaConfiguracaoRepository
            configuracaoRepository;

    public AssinaturaAcessoService(
            AssinaturaRepository assinaturaRepository,
            AssinaturaConfiguracaoRepository configuracaoRepository) {

        this.assinaturaRepository = assinaturaRepository;
        this.configuracaoRepository = configuracaoRepository;
    }

    @Transactional(readOnly = true)
    public boolean podeAcessarAreaProtegida(Long empresaId) {

        return assinaturaRepository.findByEmpresa_Id(empresaId)
                .map(this::podeAcessar)
                .orElse(false);
    }

    @Transactional
    public AssinaturaResumoResponse obterResumo(Long empresaId) {

        Assinatura assinatura =
                assinaturaRepository.findByEmpresa_Id(empresaId)
                        .orElseThrow(() -> new AssinaturaNaoEncontradaException());

        AssinaturaConfiguracao configuracao =
                buscarConfiguracao();

        atualizarStatusTrial(
                assinatura,
                LocalDate.now(),
                configuracao
        );

        return montarResumo(
                assinatura,
                configuracao
        );
    }

    public boolean podeAcessar(Assinatura assinatura) {

        AssinaturaStatus status =
                calcularStatusAtual(
                        assinatura,
                        LocalDate.now(),
                        buscarConfiguracao()
                );

        return status == AssinaturaStatus.ACTIVE
                || status == AssinaturaStatus.TRIAL
                || status == AssinaturaStatus.TRIAL_EXPIRING;
    }

    AssinaturaStatus calcularStatusAtual(
            Assinatura assinatura,
            LocalDate hoje,
            AssinaturaConfiguracao configuracao) {

        if (assinatura.getStatus() == AssinaturaStatus.ACTIVE
                || assinatura.getStatus() == AssinaturaStatus.SUSPENDED
                || assinatura.getStatus() == AssinaturaStatus.CANCELLED
                || assinatura.getStatus() == AssinaturaStatus.PENDING) {
            return assinatura.getStatus();
        }

        if (assinatura.getTrialFim() == null
                || assinatura.getTrialFim().isBefore(hoje)) {
            return AssinaturaStatus.TRIAL_EXPIRED;
        }

        long diasRestantes =
                ChronoUnit.DAYS.between(
                        hoje,
                        assinatura.getTrialFim()
                );

        if (diasRestantes <= configuracao.getDiasAvisoTrial()) {
            return AssinaturaStatus.TRIAL_EXPIRING;
        }

        return AssinaturaStatus.TRIAL;
    }

    void atualizarStatusTrial(
            Assinatura assinatura,
            LocalDate hoje,
            AssinaturaConfiguracao configuracao) {

        assinatura.atualizarStatusCalculado(
                calcularStatusAtual(
                        assinatura,
                        hoje,
                        configuracao
                )
        );
    }

    AssinaturaConfiguracao buscarConfiguracao() {

        return configuracaoRepository.findAll()
                .stream()
                .findFirst()
                .orElseThrow(() -> new AssinaturaNaoEncontradaException());
    }

    AssinaturaResumoResponse montarResumo(
            Assinatura assinatura,
            AssinaturaConfiguracao configuracao) {

        LocalDate hoje = LocalDate.now();
        long diasRestantes = assinatura.getTrialFim() == null
                ? 0
                : Math.max(
                        0,
                        ChronoUnit.DAYS.between(
                                hoje,
                                assinatura.getTrialFim()
                        )
                );

        return new AssinaturaResumoResponse(
                assinatura.getId(),
                assinatura.getEmpresa().getId(),
                assinatura.getEmpresa().getNome(),
                calcularStatusAtual(
                        assinatura,
                        hoje,
                        configuracao
                ),
                assinatura.getValorMensal(),
                assinatura.getTrialInicio(),
                assinatura.getTrialFim(),
                diasRestantes,
                podeAcessar(assinatura),
                assinatura.getProximoVencimento(),
                assinatura.getUltimoPagamentoEm(),
                configuracao.getDiasAvisoTrial(),
                configuracao.isTrialHabilitado()
        );
    }
}
