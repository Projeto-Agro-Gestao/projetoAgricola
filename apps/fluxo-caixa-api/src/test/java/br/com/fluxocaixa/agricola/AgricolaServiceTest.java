package br.com.fluxocaixa.agricola;

import br.com.fluxocaixa.colaboracao.*;
import br.com.fluxocaixa.movimentacao.MovimentacaoService;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.mock.web.MockMultipartFile;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AgricolaServiceTest {
    JdbcTemplate db;
    AgricolaService service;
    ColaboracaoService colaboracao;
    RecursosAgroController recursos;
    ProducaoIntegradaService producao;
    MovimentacaoService financeiro;
    DriverManagerDataSource ds;
    @BeforeEach void setup() {
        ds=new org.springframework.jdbc.datasource.SingleConnectionDataSource("jdbc:h2:mem:"+UUID.randomUUID()+";MODE=MySQL","sa","",true);
        db=new JdbcTemplate(ds);
        db.execute("CREATE TABLE empresas(id BIGINT PRIMARY KEY)");
        db.execute("CREATE TABLE usuarios(id BIGINT PRIMARY KEY,empresa_id BIGINT,nome VARCHAR(120),papel VARCHAR(30),ativo BOOLEAN)");
        db.execute("CREATE TABLE propriedades_rurais(id BIGINT PRIMARY KEY,empresa_id BIGINT,nome VARCHAR(150))");
        db.execute("CREATE TABLE documentos_agro(id BIGINT PRIMARY KEY,nome_arquivo VARCHAR(150),movimentacao_id BIGINT)");
        db.execute("CREATE TABLE movimentacoes(id BIGINT PRIMARY KEY,empresa_id BIGINT,tipo VARCHAR(20),excluida BOOLEAN,valor DECIMAL(19,2),propriedade_rural_id BIGINT,descricao VARCHAR(150),data_movimentacao DATE)");
        db.execute("CREATE TABLE auditoria_agro(empresa_id BIGINT,usuario_id BIGINT,acao VARCHAR(80),entidade VARCHAR(80),entidade_id BIGINT,detalhes VARCHAR(1000),criado_em TIMESTAMP)");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V35__gestao_producao_e_romaneios.sql")).execute(ds);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V36__localizacao_e_cotacoes_agricolas.sql")).execute(ds);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V37__estoque_contratos_conciliacao.sql")).execute(ds);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V38__integrar_armazenagem_entregas_e_frota.sql")).execute(ds);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V39__permissoes_agro_por_funcao_e_propriedade.sql")).execute(ds);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V40__registrar_tara_romaneio.sql")).execute(ds);
        db.update("INSERT INTO empresas VALUES(1),(2)");
        db.update("INSERT INTO usuarios VALUES(5,1,'Produtor','PRODUTOR',true),(6,1,'Funcionário','FUNCIONARIO',true),(7,2,'Outro cliente','FUNCIONARIO',true)");
        db.update("INSERT INTO propriedades_rurais(id,empresa_id,nome) VALUES(10,1,'Fazenda')");
        colaboracao=mock(ColaboracaoService.class);
        financeiro=mock(MovimentacaoService.class);
        service=new AgricolaService(db,colaboracao,financeiro,new ExtratorRomaneio("",""),new PermissoesAgroService(db));
        recursos=new RecursosAgroController(service,db);
        producao=new ProducaoIntegradaService(db,service,financeiro);
        autenticar(1,"PRODUTOR");
    }
    @AfterEach void limpar() { SecurityContextHolder.clearContext(); org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes(); ((org.springframework.jdbc.datasource.SingleConnectionDataSource)ds).destroy(); }
    void autenticar(long empresa,String papel) {
        autenticar(empresa,papel,5L);
    }
    void autenticar(long empresa,String papel,long usuario) {
        var jwt=Jwt.withTokenValue("test").header("alg","none").claim("empresaId",empresa).claim("usuarioId",usuario).claim("papel",papel).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }
    long safra() {
        when(colaboracao.listarPropriedades(1L)).thenReturn(List.of(new PropriedadeRuralResponse(10L,"Fazenda","","",new BigDecimal("100"))));
        return ((Number)service.criarSafra(1L,new AgricolaController.Safra(10L,"2026","Soja","A",new BigDecimal("10"),LocalDate.now().minusDays(50),LocalDate.now().plusDays(50))).get("id")).longValue();
    }
    AgricolaController.Operacao operacao(long safra,Long romaneio) {
        return new AgricolaController.Operacao(safra,romaneio,"chave-teste-123","COLHEITA","Colheita",LocalDate.now(),new BigDecimal("1000"),new BigDecimal("14"),new BigDecimal("2"),new BigDecimal("10"),null);
    }
    @Test void registraProducaoIndicadoresEAuditoriaSemDuplicar() {
        long id=safra();
        var salvo=service.criarOperacao(1L,operacao(id,null));
        assertThat(service.criarOperacao(1L,operacao(id,null)).get("id")).isEqualTo(salvo.get("id"));
        assertThat(service.operacoes(1L)).hasSize(1);
        var resumo=service.safras(1L).getFirst();
        assertThat((BigDecimal)resumo.get("producao_kg")).isEqualByComparingTo("970");
        assertThat((BigDecimal)resumo.get("produtividade_kg_ha")).isEqualByComparingTo("97");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM auditoria_agro",Integer.class)).isEqualTo(2);
    }
    @Test void impedeAcessoOutraEmpresaEEscritaFuncionario() {
        assertThatThrownBy(()->service.safras(2L)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        autenticar(1,"FUNCIONARIO");
        assertThatThrownBy(()->service.criarOperacao(1L,operacao(1L,null))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void impedeVinculoSafraDeOutroCliente() {
        long id=safra(); autenticar(2,"PRODUTOR");
        assertThatThrownBy(()->service.criarOperacao(2L,operacao(id,null))).hasMessageContaining("Safra não encontrada");
    }
    @Test void validaRomaneioUmaVez() {
        long safra=safra(); db.update("INSERT INTO documentos_agro VALUES(20,'romaneio.pdf',NULL)");
        db.update("INSERT INTO romaneios_agro(empresa_id,documento_id,hash_arquivo) VALUES(1,20,?)","a".repeat(64));
        Long doc=db.queryForObject("SELECT id FROM romaneios_agro",Long.class);
        service.criarOperacao(1L,operacao(safra,doc));
        assertThat(db.queryForObject("SELECT status FROM romaneios_agro",String.class)).isEqualTo("VALIDADO");
    }
    @Test void rejeitaArquivoDisfarcadoAntesDeArmazenar() {
        assertThatThrownBy(()->service.importar(1L,new MockMultipartFile("arquivo","teste.pdf","application/pdf","<script>".getBytes())))
            .hasMessageContaining("Conteúdo inválido");
        verifyNoInteractions(colaboracao);
    }
    @Test void calculaDescontoSemInventarRegraDeUmidade() {
        assertThat(PesoRomaneio.liquido(new BigDecimal("1000"),new BigDecimal("2"),new BigDecimal("10"))).isEqualByComparingTo("970");
        assertThatThrownBy(()->PesoRomaneio.liquido(BigDecimal.ONE,BigDecimal.ZERO,BigDecimal.TEN)).hasMessageContaining("Descontos excedem");
        assertThatThrownBy(()->PesoRomaneio.liquido(BigDecimal.TEN,new BigDecimal("101"),BigDecimal.ZERO)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void taraEhSubtraidaAntesDoDescontoDeImpurezas() {
        assertThat(PesoRomaneio.liquido(new BigDecimal("20000"),new BigDecimal("12000"),new BigDecimal("2"),BigDecimal.ZERO)).isEqualByComparingTo("7840");
        assertThatThrownBy(()->PesoRomaneio.liquido(BigDecimal.TEN,new BigDecimal("11"),BigDecimal.ZERO,BigDecimal.ZERO)).hasMessageContaining("tara");
    }
    @Test void extratorSemConfiguracaoPermiteRevisaoManual() {
        var extrator=new ExtratorRomaneio("","");
        assertThat(extrator.extrair(new byte[0],".pdf")).isEmpty();
        assertThat(extrator.sugerir("Produtor: João\nUmidade: 14%\nProduto: Soja")).containsEntry("produtor","João").containsEntry("umidade","14%");
    }
    @Test void estoqueExigeSaldoOperacaoEEvitaReenvio() {
        long safra=safra();
        long operacao=((Number)service.criarOperacao(1L,operacao(safra,null)).get("id")).longValue();
        recursos.insumo(1L,new RecursosAgroController.Insumo("Fertilizante","FERTILIZANTE","kg"));
        long item=db.queryForObject("SELECT id FROM insumos_agro",Long.class);
        var entrada=new RecursosAgroController.Estoque(item,null,"entrada-123","ENTRADA",new BigDecimal("100"),LocalDate.now(),"Compra conferida");
        recursos.estoque(1L,entrada); recursos.estoque(1L,entrada);
        var saida=new RecursosAgroController.Estoque(item,operacao,"saida-123","SAIDA",new BigDecimal("30"),LocalDate.now(),"Aplicação");
        recursos.estoque(1L,saida);
        assertThat(db.queryForObject("SELECT saldo FROM insumos_agro",BigDecimal.class)).isEqualByComparingTo("70");
        assertThatThrownBy(()->recursos.estoque(1L,new RecursosAgroController.Estoque(item,operacao,"saida-456","SAIDA",new BigDecimal("71"),LocalDate.now(),"Aplicação"))).hasMessageContaining("Saldo insuficiente");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM estoque_agro",Integer.class)).isEqualTo(2);
        autenticar(2,"PRODUTOR");
        assertThatThrownBy(()->recursos.estoque(2L,entrada)).hasMessageContaining("Insumo não encontrado");
    }
    @Test void conciliaSomenteEmpresaTipoDataEValorCompativeis() {
        recursos.importar(1L,new RecursosAgroController.Extrato("Banco",List.of(new RecursosAgroController.LinhaExtrato("ref1","Venda",LocalDate.now(),new BigDecimal("100")))));
        long linha=db.queryForObject("SELECT id FROM extrato_agro",Long.class);
        db.update("INSERT INTO movimentacoes(id,empresa_id,tipo,excluida,valor,descricao,data_movimentacao) VALUES(1,1,'RECEITA',false,100,'Venda',?)",LocalDate.now());
        db.update("INSERT INTO movimentacoes(id,empresa_id,tipo,excluida,valor,descricao,data_movimentacao) VALUES(2,2,'RECEITA',false,100,'Outra empresa',?)",LocalDate.now());
        db.update("INSERT INTO movimentacoes(id,empresa_id,tipo,excluida,valor,descricao,data_movimentacao) VALUES(3,1,'DESPESA',false,100,'Pagamento',?)",LocalDate.now());
        assertThat(recursos.sugestoes(1L,linha)).hasSize(1);
        assertThatThrownBy(()->recursos.conciliar(1L,linha,new RecursosAgroController.Conciliacao(2L))).hasMessageContaining("incompatível");
        recursos.conciliar(1L,linha,new RecursosAgroController.Conciliacao(1L));
        assertThatThrownBy(()->recursos.conciliar(1L,linha,new RecursosAgroController.Conciliacao(1L))).hasMessageContaining("já conciliado");
    }
    @Test void importacaoDeExtratoEhAtomicaQuandoLinhaInvalida() {
        var tx=new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds));
        var r=new RecursosAgroController.Extrato("Banco",List.of(new RecursosAgroController.LinhaExtrato("ok","Venda",LocalDate.now(),BigDecimal.TEN),new RecursosAgroController.LinhaExtrato("erro","Inválida",LocalDate.now(),BigDecimal.ZERO)));
        assertThatThrownBy(()->tx.execute(s->recursos.importar(1L,r))).hasMessageContaining("valor zero");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM extrato_agro",Integer.class)).isZero();
    }
    @Test void contratosCalculamPrevisaoSemCriarReceita() {
        long safra=safra();
        recursos.contrato(1L,new RecursosAgroController.Contrato(safra,"C-1","Cooperativa",new BigDecimal("1000"),new BigDecimal("2.50"),new BigDecimal("2"),LocalDate.now().plusDays(30)));
        var r=recursos.contratos(1L).getFirst();
        assertThat((BigDecimal)r.get("valor_previsto")).isEqualByComparingTo("2500");
        assertThat((BigDecimal)r.get("comissao_prevista")).isEqualByComparingTo("50");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM movimentacoes",Integer.class)).isZero();
    }
    @Test void climaExigePropriedadeELocalizacaoSemInventarPrevisao() {
        var clima=new ClimaController(service,db,"");
        assertThat(clima.clima(1L,10L)).containsEntry("disponivel",false);
        clima.localizar(1L,10L,new ClimaController.Localizacao(new BigDecimal("-23.5505"),new BigDecimal("-46.6333")));
        assertThat(clima.clima(1L,10L)).containsEntry("disponivel",false).containsKey("mensagem");
        assertThatThrownBy(()->clima.clima(1L,99L)).hasMessageContaining("não encontrada");
    }
    @Test void cotacoesPersistemFonteDataEIsolamento() {
        var controller=new CotacoesController(service,db);
        controller.registrar(1L,new CotacoesController.Cotacao("Soja","Teste","saca 60 kg",new BigDecimal("100"),LocalDate.now(),"Referência de teste"));
        assertThat(controller.listar(1L)).hasSize(1);
        autenticar(2,"PRODUTOR");
        assertThat(controller.listar(2L)).isEmpty();
    }
    long silo(BigDecimal capacidade) {
        return ((Number)producao.armazem(1L,new ProducaoIntegradaController.Armazem(10L,"Silo",capacidade)).get("id")).longValue();
    }
    @Test void armazenagemRespeitaCapacidadeProducaoEDuplicidade() {
        long safra=safra(); long op=((Number)service.criarOperacao(1L,operacao(safra,null)).get("id")).longValue();
        long silo=silo(new BigDecimal("500"));
        var deposito=new ProducaoIntegradaController.Deposito(silo,op,"deposito-1",new BigDecimal("400"),LocalDate.now());
        producao.depositar(1L,deposito);producao.depositar(1L,deposito);
        assertThat((BigDecimal)producao.armazens(1L).getFirst().get("saldo_kg")).isEqualByComparingTo("400");
        assertThatThrownBy(()->producao.depositar(1L,new ProducaoIntegradaController.Deposito(silo,op,"deposito-2",new BigDecimal("101"),LocalDate.now()))).hasMessageContaining("Capacidade");
        assertThatThrownBy(()->producao.depositar(1L,new ProducaoIntegradaController.Deposito(silo,op,"deposito-3",new BigDecimal("600"),LocalDate.now()))).hasMessageContaining("produção líquida");
        assertThat(producao.graos(1L)).hasSize(1);
    }
    @Test void entregaReduzEstoqueESaldoContratualComReceitaEComissaoSemDuplicar() {
        long safra=safra();long op=((Number)service.criarOperacao(1L,operacao(safra,null)).get("id")).longValue();long silo=silo(new BigDecimal("1000"));
        producao.depositar(1L,new ProducaoIntegradaController.Deposito(silo,op,"deposito-1",new BigDecimal("970"),LocalDate.now()));
        recursos.contrato(1L,new RecursosAgroController.Contrato(safra,"C-1","Comprador",new BigDecimal("600"),new BigDecimal("2"),new BigDecimal("2"),LocalDate.now()));
        long contrato=db.queryForObject("SELECT id FROM contratos_agro",Long.class);
        var entrega=new ProducaoIntegradaController.Entrega(contrato,silo,"entrega-123",new BigDecimal("500"),LocalDate.now());
        long id=((Number)producao.entregar(1L,entrega).get("id")).longValue();producao.entregar(1L,entrega);
        assertThat((BigDecimal)producao.armazens(1L).getFirst().get("saldo_kg")).isEqualByComparingTo("470");
        assertThatThrownBy(()->producao.entregar(1L,new ProducaoIntegradaController.Entrega(contrato,silo,"entrega-456",new BigDecimal("101"),LocalDate.now()))).hasMessageContaining("saldo do contrato");
        var sequencia=new java.util.concurrent.atomic.AtomicLong(1000);
        when(financeiro.criar(org.mockito.ArgumentMatchers.eq(1L),org.mockito.ArgumentMatchers.any())).thenAnswer(inv->{
            br.com.fluxocaixa.movimentacao.CriarMovimentacaoRequest r=inv.getArgument(1);long movimento=sequencia.incrementAndGet();
            db.update("INSERT INTO movimentacoes(id,empresa_id,tipo,excluida,valor,descricao,data_movimentacao) VALUES(?,?,?,false,?,?,?)",movimento,1L,r.tipo().name(),r.valor(),r.descricao(),r.dataMovimentacao());
            var resposta=mock(br.com.fluxocaixa.movimentacao.MovimentacaoResponse.class);when(resposta.id()).thenReturn(movimento);return resposta;
        });
        var liquidacao=new ProducaoIntegradaController.Liquidacao(LocalDate.now(),1L,2L);
        producao.liquidar(1L,id,liquidacao);producao.liquidar(1L,id,liquidacao);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM movimentacoes",Integer.class)).isEqualTo(2);
        var resumo=service.safras(1L).getFirst();
        assertThat((BigDecimal)resumo.get("receitas")).isEqualByComparingTo("1000");
        assertThat((BigDecimal)resumo.get("custos")).isEqualByComparingTo("20");
        assertThat((BigDecimal)resumo.get("producao_kg")).isEqualByComparingTo("970");
    }
    @Test void maquinaAtualizaHorimetroEVinculaOperacaoSemDuplicarUso() {
        long safra=safra();long op=((Number)service.criarOperacao(1L,operacao(safra,null)).get("id")).longValue();
        long maquina=((Number)producao.maquina(1L,new ProducaoIntegradaController.Maquina(10L,"Trator","TR-1",new BigDecimal("100"),new BigDecimal("105"))).get("id")).longValue();
        recursos.insumo(1L,new RecursosAgroController.Insumo("Diesel","COMBUSTIVEL","L"));
        Long combustivel=db.queryForObject("SELECT id FROM insumos_agro",Long.class);
        recursos.estoque(1L,new RecursosAgroController.Estoque(combustivel,null,"diesel-entrada","ENTRADA",new BigDecimal("100"),LocalDate.now(),"Compra"));
        var uso=new ProducaoIntegradaController.Uso(maquina,op,"uso-trator-1","USO",new BigDecimal("6"),new BigDecimal("20"),"Operação conferida",null,combustivel,null);
        producao.usar(1L,uso);producao.usar(1L,uso);
        assertThat((BigDecimal)producao.maquinas(1L).getFirst().get("horimetro")).isEqualByComparingTo("106");
        assertThat(producao.maquinas(1L).getFirst().get("manutencao_pendente")).isEqualTo(true);
        assertThat(producao.usos(1L)).hasSize(1);
        assertThat(db.queryForObject("SELECT saldo FROM insumos_agro",BigDecimal.class)).isEqualByComparingTo("80");
        autenticar(2,"PRODUTOR");assertThatThrownBy(()->producao.usar(2L,uso)).hasMessageContaining("não encontrada nesta empresa");
    }
    @Test void permissoesFiltramPropriedadesBloqueiamEscritaERelatorioGlobal() {
        long primeira=safra();
        db.update("INSERT INTO propriedades_rurais(id,empresa_id,nome) VALUES(11,1,'Outra propriedade')");
        db.update("INSERT INTO safras_agro(empresa_id,propriedade_id,nome,cultura,talhao,area_hectares,inicio,fim) VALUES(1,11,'Outra safra','Milho','B',10,?,?)",LocalDate.now(),LocalDate.now().plusDays(20));
        db.update("INSERT INTO usuarios VALUES(99,1,'Admin','ADMINISTRADOR',true)");
        var permissoes=new PermissoesAgroService(db);var controller=new PermissoesAgroController(service,permissoes,db);
        autenticar(1,"ADMINISTRADOR",99L);
        controller.salvar(1L,6L,new PermissoesAgroController.Configuracao(true,List.of(10L),List.of(new PermissoesAgroController.Regra("PRODUCAO",true,false),new PermissoesAgroController.Regra("FROTA",true,true),new PermissoesAgroController.Regra("FINANCEIRO",false,false))));
        autenticar(1,"FUNCIONARIO",6L);
        assertThat(service.safras(1L)).hasSize(1);assertThat(((Number)service.safras(1L).getFirst().get("id")).longValue()).isEqualTo(primeira);
        assertThatThrownBy(()->service.criarOperacao(1L,operacao(primeira,null))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        var req=new org.springframework.mock.web.MockHttpServletRequest("POST","/api/v1/empresas/1/agricola/maquinas");
        org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(new org.springframework.web.context.request.ServletRequestAttributes(req));
        assertThatThrownBy(()->producao.maquina(1L,new ProducaoIntegradaController.Maquina(11L,"Trator proibido","T-2",BigDecimal.ZERO,null))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        producao.maquina(1L,new ProducaoIntegradaController.Maquina(10L,"Trator permitido","T-1",BigDecimal.ZERO,null));
        assertThat(producao.maquinas(1L)).hasSize(1);
        assertThatThrownBy(()->new AgroPermissoesWebConfig(permissoes).verificar(new org.springframework.mock.web.MockHttpServletRequest("GET","/api/v1/empresas/1/dashboard/resumo"))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->controller.salvar(1L,6L,new PermissoesAgroController.Configuracao(false,List.of(),List.of()))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        autenticar(1,"ADMINISTRADOR",99L);
        assertThat(service.safras(1L)).hasSize(2);
        assertThatThrownBy(()->controller.salvar(1L,99L,new PermissoesAgroController.Configuracao(true,List.of(),List.of()))).hasMessageContaining("administrativas");
        assertThatThrownBy(()->controller.salvar(1L,7L,new PermissoesAgroController.Configuracao(false,List.of(),List.of()))).hasMessageContaining("não encontrado nesta empresa");
    }
    @Test void cotacoesSincronizamComCacheEDeduplicacaoEntreClientes() throws Exception {
        var servidor=com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
        var chamadas=new java.util.concurrent.atomic.AtomicInteger();
        servidor.createContext("/cotacoes",exchange->{
            chamadas.incrementAndGet();
            byte[] body=("[{\"cultura\":\"Soja\",\"praca\":\"Teste\",\"unidade\":\"saca 60kg\",\"valor\":100.5,\"data\":\""+LocalDate.now()+"\",\"fonte\":\"Fonte de teste\"}]").getBytes(java.nio.charset.StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200,body.length);try(var out=exchange.getResponseBody()) {out.write(body);}
        });servidor.start();
        try {
            var cotacoes=new CotacoesImportacaoService(db,new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds),"http://127.0.0.1:"+servidor.getAddress().getPort()+"/cotacoes","",false);
            assertThat(cotacoes.sincronizar(1L)).isEqualTo(1);assertThat(cotacoes.sincronizar(1L)).isZero();assertThat(cotacoes.sincronizar(2L)).isEqualTo(1);
            assertThat(chamadas.get()).isEqualTo(1);assertThat(db.queryForObject("SELECT COUNT(*) FROM cotacoes_agricolas",Integer.class)).isEqualTo(2);
        } finally {servidor.stop(0);}
    }
    @Test void importaOfxSgmlPreservandoReferenciaValorEDeduplicacao() {
        byte[] ofx=("OFXHEADER:100\n<OFX><BANKID>001<ACCTID>123<STMTTRN><FITID>ref-unica<DTPOSTED>20260115120000[-3:BRT]<TRNAMT>-25.50<NAME>Combustível</STMTTRN></OFX>").getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var extrato=ExtratoOfxParser.ler(ofx);
        assertThat(extrato.conta()).isEqualTo("001/123");assertThat(extrato.linhas().getFirst().valor()).isEqualByComparingTo("-25.50");
        assertThat(recursos.importar(1L,extrato)).containsEntry("importadas",1);assertThat(recursos.importar(1L,extrato)).containsEntry("importadas",0);
        assertThatThrownBy(()->ExtratoOfxParser.ler("<!DOCTYPE OFX><OFX></OFX>".getBytes())).hasMessageContaining("declarações externas");
        assertThatThrownBy(()->ExtratoOfxParser.ler("<OFX><ACCTID>1<ACCTID>2</OFX>".getBytes())).hasMessageContaining("única conta");
        String incompleto=new String(ofx,java.nio.charset.StandardCharsets.UTF_8).replace("</OFX>","<STMTTRN><FITID>sem-fechamento</OFX>");
        assertThatThrownBy(()->ExtratoOfxParser.ler(incompleto.getBytes(java.nio.charset.StandardCharsets.UTF_8))).hasMessageContaining("incompleto");
    }
}
