package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.categoria.CategoriaSugeridaService;
import br.com.fluxocaixa.colaboracao.AuditoriaAgro;
import br.com.fluxocaixa.colaboracao.AuditoriaAgroRepository;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.StatusPagamento;
import br.com.fluxocaixa.usuario.TipoAcessoUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioProvisionamentoService;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Set;

@Service
public class AdminService {

    private static final Logger log =
            LoggerFactory.getLogger(AdminService.class);

    private static final Set<PapelUsuario> PAPEIS_ADMINISTRATIVOS =
            Set.of(
                    PapelUsuario.ADMINISTRADOR,
                    PapelUsuario.SUPER_ADMIN
            );

    private final UsuarioRepository usuarioRepository;
    private final UsuarioAcessoRepository usuarioAcessoRepository;
    private final CategoriaSugeridaService categoriaSugeridaService;
    private final UsuarioProvisionamentoService provisionamentoService;
    private final AuditoriaAgroRepository auditoriaRepository;

    public AdminService(
            UsuarioRepository usuarioRepository,
            UsuarioAcessoRepository usuarioAcessoRepository,
            CategoriaSugeridaService categoriaSugeridaService,
            UsuarioProvisionamentoService provisionamentoService,
            AuditoriaAgroRepository auditoriaRepository) {

        this.usuarioRepository = usuarioRepository;
        this.usuarioAcessoRepository = usuarioAcessoRepository;
        this.categoriaSugeridaService = categoriaSugeridaService;
        this.provisionamentoService = provisionamentoService;
        this.auditoriaRepository = auditoriaRepository;
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
        usuario.configurarAcesso(
                request.acessoLiberado(),
                obterTipoAcesso(request),
                obterDataExpiracao(request)
        );

        return montarResponse(usuario);
    }

    @Transactional
    public AdminUsuarioResponse aprovarUsuario(
            Long usuarioId,
            AprovarUsuarioRequest request) {

        validarAdministrador();

        Usuario usuario = buscarUsuario(usuarioId);

        if (request.papel() != PapelUsuario.PRODUTOR
                && request.papel() != PapelUsuario.CONTADOR) {
            throw new IllegalArgumentException(
                    "Cadastro publico so pode ser aprovado como PRODUTOR ou CONTADOR."
            );
        }

        usuario.alterarPapel(request.papel());
        usuario.configurarAcesso(
                true,
                TipoAcessoUsuario.VITALICIO,
                null
        );
        usuario.atualizarPagamento(
                StatusPagamento.ISENTO,
                null
        );
        provisionamentoService.garantirEstruturaOperacional(usuario);

        return montarResponse(usuario);
    }

    @Transactional
    public AdminUsuarioResponse atualizarPapel(
            Long usuarioId,
            AtualizarPapelUsuarioRequest request) {

        Usuario executor = buscarAdministradorAutenticado();

        Usuario usuario = buscarUsuario(usuarioId);
        PapelUsuario novoPapel = request.papel();
        PapelUsuario papelAnterior = usuario.getPapel();

        if (usuario.getPapel() == PapelUsuario.SUPER_ADMIN
                || novoPapel == PapelUsuario.SUPER_ADMIN) {
            throw new IllegalArgumentException(
                    "O perfil SUPER_ADMIN nao pode ser alterado por esta rotina."
            );
        }

        if (novoPapel != PapelUsuario.ADMINISTRADOR
                && novoPapel != PapelUsuario.PRODUTOR
                && novoPapel != PapelUsuario.CONTADOR) {
            throw new IllegalArgumentException(
                    "Informe PRODUTOR, CONTADOR ou ADMINISTRADOR."
            );
        }

        validarAlteracaoSeguraDePapel(
                executor,
                usuario,
                novoPapel
        );

        if (papelAnterior == novoPapel) {
            return montarResponse(usuario);
        }

        usuario.alterarPapel(novoPapel);

        if (!isAdministrador(novoPapel)) {
            provisionamentoService.garantirEstruturaOperacional(usuario);
        } else {
            usuario.configurarAcesso(
                    true,
                    TipoAcessoUsuario.VITALICIO,
                    null
            );
            usuario.atualizarPagamento(
                    StatusPagamento.ISENTO,
                    null
            );
        }

        registrarAuditoriaAlteracaoPapel(
                executor,
                usuario,
                papelAnterior,
                novoPapel
        );

        log.info(
                "UserRoleChanged executorId={} targetUserId={} oldRole={} newRole={}",
                executor.getId(),
                usuario.getId(),
                papelAnterior,
                novoPapel
        );

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
        categoriaSugeridaService.garantirCategoriasPorAtividade(
                usuario.getEmpresa(),
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
                calcularSituacao(
                        usuario,
                        hoje
                )
        );
    }

    private String calcularSituacao(
            Usuario usuario,
            LocalDate hoje) {

        if (!usuario.isAcessoLiberado()) {
            if (usuario.getStatusPagamento() == StatusPagamento.TESTE) {
                return "PENDENTE_APROVACAO";
            }

            return "BLOQUEADO";
        }

        if (!usuario.possuiAcessoValido(hoje)) {
            return "ACESSO_EXPIRADO";
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

    private TipoAcessoUsuario obterTipoAcesso(
            AtualizarAcessoUsuarioRequest request) {

        TipoAcessoUsuario tipoAcesso =
                request.tipoAcesso() == null
                        ? TipoAcessoUsuario.NORMAL
                        : request.tipoAcesso();

        if (tipoAcesso == TipoAcessoUsuario.PRAZO
                && request.diasAcesso() == null
                && request.acessoExpiraEm() == null) {
            throw new IllegalArgumentException(
                    "Informe a quantidade de dias ou a data final do acesso"
            );
        }

        return tipoAcesso;
    }

    private LocalDate obterDataExpiracao(
            AtualizarAcessoUsuarioRequest request) {

        TipoAcessoUsuario tipoAcesso =
                obterTipoAcesso(request);

        if (tipoAcesso != TipoAcessoUsuario.PRAZO) {
            return null;
        }

        if (request.diasAcesso() != null) {
            if (request.diasAcesso() <= 0) {
                throw new IllegalArgumentException(
                        "A quantidade de dias deve ser maior que zero"
                );
            }

            return LocalDate.now()
                    .plusDays(request.diasAcesso());
        }

        return request.acessoExpiraEm();
    }

    private void validarAdministrador() {
        buscarAdministradorAutenticado();
    }

    private Usuario buscarAdministradorAutenticado() {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Jwt jwt)
                || !isAdministrador(jwt.getClaimAsString("papel"))) {
            throw new AcessoAdministrativoNegadoException();
        }

        Number usuarioIdClaim = jwt.getClaim("usuarioId");

        if (usuarioIdClaim == null) {
            throw new AcessoAdministrativoNegadoException();
        }

        Long usuarioId = usuarioIdClaim.longValue();

        return usuarioRepository.findById(usuarioId)
                .filter(Usuario::isAtivo)
                .filter(usuario -> isAdministrador(usuario.getPapel()))
                .orElseThrow(AcessoAdministrativoNegadoException::new);
    }

    private boolean isAdministrador(String papel) {
        return PapelUsuario.ADMINISTRADOR.name().equals(papel)
                || PapelUsuario.SUPER_ADMIN.name().equals(papel);
    }

    private boolean isAdministrador(PapelUsuario papel) {
        return papel == PapelUsuario.ADMINISTRADOR
                || papel == PapelUsuario.SUPER_ADMIN;
    }

    private void validarAlteracaoSeguraDePapel(
            Usuario executor,
            Usuario alvo,
            PapelUsuario novoPapel) {

        if (executor.getId().equals(alvo.getId())
                && !isAdministrador(novoPapel)) {
            throw new RegraAdministrativaException(
                    "Voce nao pode remover o proprio acesso administrativo por esta rotina."
            );
        }

        if (isAdministrador(alvo.getPapel())
                && !isAdministrador(novoPapel)) {
            long administradoresRestantes =
                    usuarioRepository
                            .countByPapelInAndAtivoTrueAndIdNot(
                                    PAPEIS_ADMINISTRATIVOS,
                                    alvo.getId()
                            );

            if (administradoresRestantes == 0) {
                throw new RegraAdministrativaException(
                        "Nao e permitido remover o ultimo administrador ativo do sistema."
                );
            }
        }
    }

    private void registrarAuditoriaAlteracaoPapel(
            Usuario executor,
            Usuario alvo,
            PapelUsuario papelAnterior,
            PapelUsuario novoPapel) {

        auditoriaRepository.save(
                new AuditoriaAgro(
                        alvo.getEmpresa(),
                        executor,
                        "USUARIO_PAPEL_ALTERADO",
                        "USUARIO",
                        alvo.getId(),
                        "executorId=" + executor.getId()
                                + "; targetUserId=" + alvo.getId()
                                + "; oldRole=" + papelAnterior
                                + "; newRole=" + novoPapel
                )
        );
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
