package br.com.fluxocaixa.colaboracao;

import br.com.fluxocaixa.categoria.Categoria;
import br.com.fluxocaixa.categoria.CategoriaRepository;
import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ColaboracaoServiceTest {

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private PropriedadeRuralRepository propriedadeRepository;

    @Mock
    private AtividadeRuralRepository atividadeRepository;

    @Mock
    private DocumentoAgroRepository documentoRepository;

    @Mock
    private PendenciaAgroRepository pendenciaRepository;

    @Mock
    private PendenciaMensagemRepository mensagemRepository;

    @Mock
    private RateioRepository rateioRepository;

    @Mock
    private ContadorEmpresaRepository contadorEmpresaRepository;

    @Mock
    private AuditoriaAgroRepository auditoriaRepository;

    @Mock
    private ClassificacaoContabilRepository classificacaoContabilRepository;

    @Mock
    private AnaliseFiscalMovimentacaoRepository analiseFiscalRepository;

    @Mock
    private RegimeTributarioEmpresaRepository regimeTributarioRepository;

    @Mock
    private ParametroTributarioRepository parametroTributarioRepository;

    private ColaboracaoService service;
    private Empresa empresa;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        service = new ColaboracaoService(
                empresaRepository,
                usuarioRepository,
                movimentacaoRepository,
                categoriaRepository,
                propriedadeRepository,
                atividadeRepository,
                documentoRepository,
                pendenciaRepository,
                mensagemRepository,
                rateioRepository,
                contadorEmpresaRepository,
                auditoriaRepository,
                classificacaoContabilRepository,
                analiseFiscalRepository,
                regimeTributarioRepository,
                parametroTributarioRepository
        );

        empresa = new Empresa("Fazenda Teste", null);
        ReflectionTestUtils.setField(empresa, "id", 1L);

        usuario = new Usuario(
                empresa,
                "Produtor Teste",
                "produtor@teste.com",
                null,
                "hash",
                PapelUsuario.PRODUTOR
        );
        ReflectionTestUtils.setField(usuario, "id", 1L);

        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("usuarioId", 1L)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        SecurityContextHolder.getContext()
                .setAuthentication(new JwtAuthenticationToken(jwt));

        when(usuarioRepository.findById(1L))
                .thenReturn(Optional.of(usuario));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void sugereCategoriaPorTextoDaDescricao() {
        Categoria combustivel =
                new Categoria(
                        empresa,
                        "Combustivel",
                        TipoMovimentacao.DESPESA
                );
        ReflectionTestUtils.setField(combustivel, "id", 10L);

        when(categoriaRepository
                .findAllByEmpresa_IdAndTipoAndAtivoTrueOrderByNomeAsc(
                        1L,
                        TipoMovimentacao.DESPESA
                ))
                .thenReturn(List.of(combustivel));

        ClassificacaoSugestaoResponse sugestao =
                service.sugerirClassificacao(
                        1L,
                        new SugerirClassificacaoRequest(
                                "Abastecimento combustivel trator",
                                "Posto Rural",
                                TipoMovimentacao.DESPESA,
                                new BigDecimal("450.00")
                        )
                );

        assertThat(sugestao.categoriaId()).isEqualTo(10L);
        assertThat(sugestao.categoriaNome()).isEqualTo("Combustivel");
        assertThat(sugestao.confianca()).isGreaterThanOrEqualTo(80);
    }

    @Test
    void rejeitaRateioPercentualQueNaoFechaCemPorCento() {
        Movimentacao movimentacao = new Movimentacao(
                empresa,
                null,
                "Compra de insumos",
                new BigDecimal("1000.00"),
                TipoMovimentacao.DESPESA,
                LocalDate.now(),
                null
        );
        ReflectionTestUtils.setField(movimentacao, "id", 50L);

        when(empresaRepository.findById(1L))
                .thenReturn(Optional.of(empresa));
        when(movimentacaoRepository
                .findByIdAndEmpresa_IdAndExcluidaFalse(50L, 1L))
                .thenReturn(Optional.of(movimentacao));
        when(rateioRepository.findByMovimentacao_IdAndEmpresa_Id(50L, 1L))
                .thenReturn(Optional.empty());

        CriarRateioRequest request = new CriarRateioRequest(
                50L,
                TipoRateio.PERCENTUAL,
                null,
                List.of(
                        new CriarRateioRequest.Item(
                                null,
                                "Fazenda A",
                                new BigDecimal("60.00"),
                                null
                        ),
                        new CriarRateioRequest.Item(
                                null,
                                "Fazenda B",
                                new BigDecimal("30.00"),
                                null
                        )
                )
        );

        assertThatThrownBy(() -> service.criarRateio(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100%");
    }

    @Test
    void dashboardContabilUsaMovimentacoesComoFonteDeVerdade() {
        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.withDayOfMonth(1);
        LocalDate fim = hoje.withDayOfMonth(hoje.lengthOfMonth());

        when(empresaRepository.findById(1L))
                .thenReturn(Optional.of(empresa));
        when(movimentacaoRepository.somarPorTipoEPeriodoEArea(
                1L,
                TipoMovimentacao.RECEITA,
                inicio,
                fim,
                null
        )).thenReturn(new BigDecimal("30000.00"));
        when(movimentacaoRepository.somarPorTipoEPeriodoEArea(
                1L,
                TipoMovimentacao.DESPESA,
                inicio,
                fim,
                null
        )).thenReturn(new BigDecimal("12000.00"));
        when(movimentacaoRepository.buscarPeriodoDesc(1L, inicio, fim))
                .thenReturn(List.of());
        when(analiseFiscalRepository
                .findAllByEmpresa_IdOrderByAtualizadoEmDesc(1L))
                .thenReturn(List.of());
        when(regimeTributarioRepository
                .findFirstByEmpresa_IdAndDataInicioLessThanEqualAndSituacaoOrderByDataInicioDescIdDesc(
                        1L,
                        fim,
                        "ATIVO"
                ))
                .thenReturn(Optional.empty());
        when(documentoRepository.findAllByEmpresa_IdOrderByCriadoEmDesc(1L))
                .thenReturn(List.of());
        when(documentoRepository.countByEmpresa_IdAndStatus(
                1L,
                StatusDocumentoAgro.AGUARDANDO_ANALISE
        )).thenReturn(0L);
        when(movimentacaoRepository.countDespesasSemDocumento(1L))
                .thenReturn(0L);

        ContadorDashboardFiscalResponse dashboard =
                service.dashboardContabil(1L, null, null);

        assertThat(dashboard.receitaBruta())
                .isEqualByComparingTo("30000.00");
        assertThat(dashboard.despesasRegistradas())
                .isEqualByComparingTo("12000.00");
        assertThat(dashboard.resultadoFinanceiro())
                .isEqualByComparingTo("18000.00");
        assertThat(dashboard.tributoEstimado())
                .isEqualByComparingTo("0.00");
    }
}
