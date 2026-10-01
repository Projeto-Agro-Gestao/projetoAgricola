package br.com.fluxocaixa.assinatura;

import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class AssinaturaAcessoService {

    private final AssinaturaRepository assinaturaRepository;
    private final AssinaturaConfiguracaoRepository
            configuracaoRepository;
    private final UsuarioRepository usuarioRepository;

    public AssinaturaAcessoService(
            AssinaturaRepository assinaturaRepository,
            AssinaturaConfiguracaoRepository configuracaoRepository,
            UsuarioRepository usuarioRepository) {

        this.assinaturaRepository = assinaturaRepository;
        this.configuracaoRepository = configuracaoRepository;
        this.usuarioRepository = usuarioRepository;
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
                || status == AssinaturaStatus.TRIAL_EXPIRING
                || status == AssinaturaStatus.GRACE_PERIOD;
    }

    AssinaturaStatus calcularStatusAtual(
            Assinatura assinatura,
            LocalDate hoje,
            AssinaturaConfiguracao configuracao) {

        if (configuracao.getPrecoMensal().signum() == 0) {
            return AssinaturaStatus.ACTIVE;
        }

        if (assinatura.getStatus() == AssinaturaStatus.SUSPENDED
                || assinatura.getStatus() == AssinaturaStatus.CANCELLED
                || assinatura.getStatus() == AssinaturaStatus.PENDING) {
            return assinatura.getStatus();
        }

        if (assinatura.getStatus() == AssinaturaStatus.ACTIVE
                || assinatura.getStatus() == AssinaturaStatus.OVERDUE
                || assinatura.getStatus() == AssinaturaStatus.GRACE_PERIOD
                || assinatura.getStatus() == AssinaturaStatus.BLOCKED) {
            return calcularStatusPagamento(
                    assinatura,
                    hoje,
                    configuracao
            );
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

    AssinaturaStatus calcularStatusPagamento(
            Assinatura assinatura,
            LocalDate hoje,
            AssinaturaConfiguracao configuracao) {

        if (assinatura.getProximoVencimento() == null
                || !assinatura.getProximoVencimento().isBefore(hoje)) {
            return AssinaturaStatus.ACTIVE;
        }

        LocalDate fimCarencia =
                calcularFimCarencia(
                        assinatura,
                        configuracao
                );

        if (fimCarencia != null && !hoje.isAfter(fimCarencia)) {
            return AssinaturaStatus.GRACE_PERIOD;
        }

        return AssinaturaStatus.BLOCKED;
    }

    LocalDate calcularFimCarencia(
            Assinatura assinatura,
            AssinaturaConfiguracao configuracao) {

        if (assinatura.getProximoVencimento() == null) {
            return null;
        }

        return assinatura.getProximoVencimento()
                .plusDays(configuracao.getDiasCarencia());
    }

    LocalDate calcularDataBloqueio(
            Assinatura assinatura,
            AssinaturaConfiguracao configuracao) {

        LocalDate fimCarencia =
                calcularFimCarencia(
                        assinatura,
                        configuracao
                );

        return fimCarencia == null
                ? null
                : fimCarencia.plusDays(1);
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
        AssinaturaStatus statusAtual =
                calcularStatusAtual(
                        assinatura,
                        hoje,
                        configuracao
                );

        long diasRestantes = assinatura.getTrialFim() == null
                ? 0
                : Math.max(
                        0,
                        ChronoUnit.DAYS.between(
                                hoje,
                                assinatura.getTrialFim()
                        )
                );

        LocalDate fimCarencia =
                calcularFimCarencia(
                        assinatura,
                        configuracao
                );

        long diasRestantesCarencia =
                fimCarencia == null
                        || assinatura.getProximoVencimento() == null
                        || !assinatura.getProximoVencimento()
                        .isBefore(hoje)
                        ? 0
                        : Math.max(
                                0,
                                ChronoUnit.DAYS.between(
                                        hoje,
                                        fimCarencia
                                ) + 1
                        );

        Usuario usuarioPrincipal =
                usuarioRepository
                        .findFirstByEmpresa_IdOrderByIdAsc(
                                assinatura.getEmpresa().getId()
                        )
                        .orElse(null);

        return new AssinaturaResumoResponse(
                assinatura.getId(),
                assinatura.getEmpresa().getId(),
                assinatura.getEmpresa().getNome(),
                statusAtual,
                configuracao.getPrecoMensal(),
                assinatura.getTrialInicio(),
                assinatura.getTrialFim(),
                diasRestantes,
                statusAtual == AssinaturaStatus.ACTIVE
                        || statusAtual == AssinaturaStatus.TRIAL
                        || statusAtual == AssinaturaStatus.TRIAL_EXPIRING
                        || statusAtual == AssinaturaStatus.GRACE_PERIOD,
                assinatura.getProximoVencimento(),
                assinatura.getUltimoPagamentoEm(),
                assinatura.getDiaVencimento(),
                fimCarencia,
                calcularDataBloqueio(
                        assinatura,
                        configuracao
                ),
                diasRestantesCarencia,
                configuracao.getDiasAvisoTrial(),
                configuracao.isTrialHabilitado(),
                configuracao.getIntervaloAlertaMinutos(),
                configuracao.isPixHabilitado(),
                configuracao.isBoletoHabilitado(),
                configuracao.getDiasAvisoVencimento(),
                tipoDocumento(assinatura.getEmpresa().getDocumento()),
                assinatura.getEmpresa().getDocumento(),
                assinatura.getEmpresa().getCepCobranca(),
                assinatura.getEmpresa().getRuaCobranca(),
                assinatura.getEmpresa().getNumeroCobranca(),
                assinatura.getEmpresa().isSemNumeroCobranca(),
                assinatura.getEmpresa().getComplementoCobranca(),
                assinatura.getEmpresa().getBairroCobranca(),
                assinatura.getEmpresa().getCidadeCobranca(),
                assinatura.getEmpresa().getEstadoCobranca(),
                assinatura.getEmpresa().getObservacoesEnderecoCobranca(),
                usuarioPrincipal == null
                        ? null
                        : usuarioPrincipal.getTelefone(),
                usuarioPrincipal == null
                        ? null
                        : usuarioPrincipal.getEmail(),
                dadosCobrancaCompletos(assinatura)
        );
    }

    boolean dadosCobrancaCompletos(Assinatura assinatura) {
        return possuiValor(assinatura.getEmpresa().getDocumento())
                && possuiValor(assinatura.getEmpresa().getCepCobranca())
                && possuiValor(assinatura.getEmpresa().getRuaCobranca())
                && (
                        assinatura.getEmpresa().isSemNumeroCobranca()
                                || possuiValor(assinatura.getEmpresa().getNumeroCobranca())
                )
                && possuiValor(assinatura.getEmpresa().getBairroCobranca())
                && possuiValor(assinatura.getEmpresa().getCidadeCobranca())
                && possuiValor(assinatura.getEmpresa().getEstadoCobranca());
    }

    private boolean possuiValor(String valor) {
        return valor != null && !valor.isBlank();
    }

    private String tipoDocumento(String documento) {
        if (documento == null) {
            return null;
        }

        String digitos = documento.replaceAll("[^0-9]", "");

        if (digitos.length() == 11) {
            return "CPF";
        }

        if (digitos.length() == 14) {
            return "CNPJ";
        }

        return null;
    }
}
