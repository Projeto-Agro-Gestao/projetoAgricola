package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.StatusPagamento;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AdminService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioAcessoRepository usuarioAcessoRepository;

    public AdminService(
            UsuarioRepository usuarioRepository,
            UsuarioAcessoRepository usuarioAcessoRepository) {

        this.usuarioRepository = usuarioRepository;
        this.usuarioAcessoRepository = usuarioAcessoRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminUsuarioResponse> listarUsuarios() {

        validarAdministrador();

        return usuarioRepository.findAll(
                        Sort.by("nome").ascending()
                )
                .stream()
                .map(this::montarResponse)
                .toList();
    }

    @Transactional
    public AdminUsuarioResponse atualizarAcesso(
            Long usuarioId,
            AtualizarAcessoUsuarioRequest request) {

        validarAdministrador();

        Usuario usuario = buscarUsuario(usuarioId);
        usuario.alterarAcessoLiberado(request.acessoLiberado());

        return montarResponse(usuario);
    }

    @Transactional
    public AdminUsuarioResponse atualizarPagamento(
            Long usuarioId,
            AtualizarPagamentoUsuarioRequest request) {

        validarAdministrador();

        Usuario usuario = buscarUsuario(usuarioId);
        usuario.atualizarPagamento(
                request.statusPagamento(),
                request.dataVencimentoPagamento()
        );

        return montarResponse(usuario);
    }

    @Transactional
    public AdminUsuarioResponse atualizarDados(
            Long usuarioId,
            AtualizarDadosUsuarioRequest request) {

        validarAdministrador();

        Usuario usuario = buscarUsuario(usuarioId);
        String email = normalizarEmail(request.email());

        if (!usuario.getEmail().equalsIgnoreCase(email)
                && usuarioRepository
                .existsByEmailIgnoreCase(email)) {
            throw new br.com.fluxocaixa.usuario
                    .EmailJaCadastradoException();
        }

        usuario.alterarDados(
                normalizarTextoObrigatorio(request.nome()),
                normalizarTextoOpcional(request.telefone())
        );
        usuario.alterarEmail(email);
        usuario.getEmpresa().alterarNome(
                normalizarTextoObrigatorio(
                        request.nomeEmpresa()
                )
        );
        usuario.getEmpresa().configurarAtividades(
                request.agriculturaAtiva(),
                request.pecuariaAtiva()
        );

        return montarResponse(usuario);
    }

    private Usuario buscarUsuario(Long usuarioId) {

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Usuario nao encontrado"
                ));
    }

    private AdminUsuarioResponse montarResponse(
            Usuario usuario) {

        LocalDate hoje = LocalDate.now();

        long usosHoje =
                usuarioAcessoRepository.somarUsosPorUsuarioEData(
                        usuario.getId(),
                        hoje
                );

        long usosTotais =
                usuarioAcessoRepository.somarUsosPorUsuario(
                        usuario.getId()
                );

        long diasComUso =
                usuarioAcessoRepository.contarDiasComUso(
                        usuario.getId()
                );

        BigDecimal media = diasComUso == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(usosTotais)
                .divide(
                        BigDecimal.valueOf(diasComUso),
                        2,
                        RoundingMode.HALF_UP
                );

        return AdminUsuarioResponse.de(
                usuario,
                usosHoje,
                usosTotais,
                diasComUso,
                media,
                calcularSituacao(usuario)
        );
    }

    private String calcularSituacao(Usuario usuario) {

        if (!usuario.isAcessoLiberado()) {
            return "BLOQUEADO";
        }

        if (usuario.getStatusPagamento()
                == StatusPagamento.ATRASADO) {
            return "ATRASADO";
        }

        if (usuario.getStatusPagamento()
                == StatusPagamento.TESTE) {
            return "USANDO_SEM_PAGAR";
        }

        LocalDateTime limiteSemUso =
                LocalDateTime.now().minusDays(7);

        if (usuario.getUltimoUsoEm() == null
                || usuario.getUltimoUsoEm()
                .isBefore(limiteSemUso)) {
            return "SEM_USO";
        }

        return "EM_DIA";
    }

    private void validarAdministrador() {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Jwt jwt)
                || !PapelUsuario.ADMINISTRADOR.name()
                .equals(jwt.getClaimAsString("papel"))) {
            throw new AcessoAdministrativoNegadoException();
        }
    }

    private String normalizarEmail(String email) {

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private String normalizarTextoObrigatorio(String texto) {

        return texto
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizarTextoOpcional(String texto) {

        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto
                .trim()
                .replaceAll("\\s+", " ");
    }
}
