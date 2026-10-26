package br.com.fluxocaixa.agricola;

import br.com.fluxocaixa.empresa.*;
import br.com.fluxocaixa.usuario.*;
import br.com.fluxocaixa.categoria.*;
import br.com.fluxocaixa.colaboracao.*;
import br.com.fluxocaixa.movimentacao.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.mock.web.MockMultipartFile;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Base64;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:agro-integracao;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.flyway.enabled=false","spring.jpa.hibernate.ddl-auto=create-drop",
    "app.seguranca.jwt.segredo-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
    "asaas.api-key=","asaas.webhook-token=teste-local-sem-cobranca","agro.cotacoes.url=","agro.cotacoes.automatico=false",
    "agro.ia.modelo=","agro.ocr.tesseract=","agro.ocr.pdftotext=","agro.clima.user-agent="
})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ProducaoIntegradaContextTest {
    @Autowired JdbcTemplate db;
    @Autowired javax.sql.DataSource ds;
    @Autowired EmpresaRepository empresas;
    @Autowired UsuarioRepository usuarios;
    @Autowired PropriedadeRuralRepository propriedades;
    @Autowired CategoriaRepository categorias;
    @Autowired AgricolaService agricola;
    @Autowired ProducaoIntegradaService producao;
    @Autowired RecursosAgroController recursos;
    @Autowired ColaboracaoService colaboracao;
    @BeforeAll void schema() {
        // Coluna legada V24 sem mapeamento JPA; somente no banco de teste recém-criado.
        // propriedade_rural_id agora e mapeada pela entidade atual.
        for(String script:new String[]{"V35__gestao_producao_e_romaneios.sql","V36__localizacao_e_cotacoes_agricolas.sql","V37__estoque_contratos_conciliacao.sql","V38__integrar_armazenagem_entregas_e_frota.sql","V39__permissoes_agro_por_funcao_e_propriedade.sql","V40__registrar_tara_romaneio.sql"})
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/"+script)).execute(ds);
    }
    @AfterEach void limpar() { SecurityContextHolder.clearContext(); }
    @Test void conectaJpaJdbcProducaoEstoqueContratoFinanceiroEAuditoriaSemMocks() {
        Empresa empresa=empresas.saveAndFlush(new Empresa("Fazenda de teste isolado",null));Long emp=empresa.getId();
        Usuario usuario=usuarios.saveAndFlush(new Usuario(empresa,"Produtor de teste","integracao@teste.invalid",null,"hash-apenas-fixture",PapelUsuario.PRODUTOR));
        var jwt=Jwt.withTokenValue("contexto-local-teste").header("alg","none").claim("empresaId",emp).claim("usuarioId",usuario.getId()).claim("papel","PRODUTOR").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        Long propriedade=propriedades.saveAndFlush(new PropriedadeRural(empresa,"Fazenda","Município","SP",new BigDecimal("100"))).getId();
        Long receita=categorias.saveAndFlush(new Categoria(empresa,"Venda",TipoMovimentacao.RECEITA)).getId();
        Long despesa=categorias.saveAndFlush(new Categoria(empresa,"Custos",TipoMovimentacao.DESPESA)).getId();
        LocalDate hoje=LocalDate.now();
        Long safra=((Number)agricola.criarSafra(emp,new AgricolaController.Safra(propriedade,"2026","Soja","A",new BigDecimal("10"),hoje.minusDays(20),hoje.plusDays(20))).get("id")).longValue();
        var custo=new CriarMovimentacaoRequest("Custo da colheita",new BigDecimal("1000"),TipoMovimentacao.DESPESA,despesa,hoje,null,null,null,null,null,null,null,null,null);
        Long colheita=((Number)agricola.criarOperacao(emp,new AgricolaController.Operacao(safra,null,"colheita-integracao","COLHEITA","Colheita",hoje,new BigDecimal("1100"),new BigDecimal("14"),new BigDecimal("2"),new BigDecimal("10"),custo,new BigDecimal("100"))).get("id")).longValue();
        Long silo=((Number)producao.armazem(emp,new ProducaoIntegradaController.Armazem(propriedade,"Silo A",new BigDecimal("1000"))).get("id")).longValue();
        producao.depositar(emp,new ProducaoIntegradaController.Deposito(silo,colheita,"deposito-integracao",new BigDecimal("970"),hoje));
        recursos.contrato(emp,new RecursosAgroController.Contrato(safra,"Contrato-integ","Comprador",new BigDecimal("500"),new BigDecimal("2"),new BigDecimal("2"),hoje));
        Long contrato=db.queryForObject("SELECT id FROM contratos_agro WHERE empresa_id=?",Long.class,emp);
        Long entrega=((Number)producao.entregar(emp,new ProducaoIntegradaController.Entrega(contrato,silo,"entrega-integracao",new BigDecimal("500"),hoje)).get("id")).longValue();
        var liquidacao=new ProducaoIntegradaController.Liquidacao(hoje,receita,despesa);
        assertThatThrownBy(()->producao.liquidar(emp,entrega,new ProducaoIntegradaController.Liquidacao(hoje,receita,999999L))).isInstanceOf(CategoriaNaoEncontradaException.class);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM movimentacoes WHERE empresa_id=?",Integer.class,emp)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT receita_id FROM entregas_agro WHERE id=?",Long.class,entrega)).isNull();
        producao.liquidar(emp,entrega,liquidacao);producao.liquidar(emp,entrega,liquidacao);
        recursos.insumo(emp,new RecursosAgroController.Insumo("Diesel","COMBUSTIVEL","L"));
        Long diesel=db.queryForObject("SELECT id FROM insumos_agro WHERE empresa_id=?",Long.class,emp);
        recursos.estoque(emp,new RecursosAgroController.Estoque(diesel,null,"diesel-integracao","ENTRADA",new BigDecimal("100"),hoje,"Entrada conferida"));
        Long maquina=((Number)producao.maquina(emp,new ProducaoIntegradaController.Maquina(propriedade,"Trator","TR-integ",new BigDecimal("100"),new BigDecimal("105"))).get("id")).longValue();
        var custoMaquina=new CriarMovimentacaoRequest("Custo da máquina",new BigDecimal("50"),TipoMovimentacao.DESPESA,despesa,hoje,null,null,null,null,null,null,null,null,null);
        var uso=new ProducaoIntegradaController.Uso(maquina,colheita,"uso-integracao","USO",new BigDecimal("6"),new BigDecimal("20"),"Uso na colheita",custoMaquina,diesel,null);
        producao.usar(emp,uso);producao.usar(emp,uso);
        var resumo=agricola.safras(emp).getFirst();
        assertThat((BigDecimal)resumo.get("producao_kg")).isEqualByComparingTo("970");
        assertThat((BigDecimal)resumo.get("custos")).isEqualByComparingTo("1070");
        assertThat((BigDecimal)resumo.get("receitas")).isEqualByComparingTo("1000");
        assertThat((BigDecimal)producao.armazens(emp).getFirst().get("saldo_kg")).isEqualByComparingTo("470");
        assertThat(db.queryForObject("SELECT saldo FROM insumos_agro WHERE id=?",BigDecimal.class,diesel)).isEqualByComparingTo("80");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM movimentacoes WHERE empresa_id=?",Integer.class,emp)).isEqualTo(4);
        assertThat(colaboracao.dashboardProdutor(emp).receitasMes()).isEqualByComparingTo("1000");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM auditoria_agro WHERE empresa_id=?",Integer.class,emp)).isGreaterThan(5);
        byte[] png=Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
        var doc=agricola.importar(emp,new MockMultipartFile("arquivo","romaneio.png","image/png",png),propriedade);
        assertThat(agricola.arquivoRomaneio(emp,((Number)doc.get("id")).longValue()).getConteudo()).containsExactly(png);
    }
}
