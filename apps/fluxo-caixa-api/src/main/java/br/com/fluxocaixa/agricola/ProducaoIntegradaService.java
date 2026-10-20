package br.com.fluxocaixa.agricola;

import br.com.fluxocaixa.movimentacao.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.LocalDate;
import java.util.*;

@Service
public class ProducaoIntegradaService {
    private final JdbcTemplate db;
    private final AgricolaService acesso;
    private final MovimentacaoService financeiro;
    public ProducaoIntegradaService(JdbcTemplate db,AgricolaService acesso,MovimentacaoService financeiro) { this.db=db;this.acesso=acesso;this.financeiro=financeiro; }
    private Map<String,Object> primeiro(List<Map<String,Object>> rows,String erro) {
        if(rows.isEmpty()) throw new IllegalArgumentException(erro);return rows.getFirst();
    }
    private BigDecimal decimal(Map<String,Object> row,String key) { return new BigDecimal(row.get(key).toString()); }
    private long id(Map<String,Object> row,String key) { return ((Number)row.get(key)).longValue(); }
    private Map<String,Object> armazemBloqueado(Long empresa,Long armazem) {
        var silo=primeiro(db.queryForList("SELECT * FROM armazens_agro WHERE id=? AND empresa_id=? FOR UPDATE",armazem,empresa),"Armazém não encontrado nesta empresa.");
        acesso.permissoes().propriedade(empresa,id(silo,"propriedade_id"));return silo;
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> armazens(Long empresa) {
        acesso.acesso(empresa);
        return acesso.permissoes().filtrar(empresa,db.queryForList("SELECT a.*,p.nome propriedade,COALESCE((SELECT SUM(g.quantidade_kg) FROM graos_agro g WHERE g.armazem_id=a.id AND g.empresa_id=a.empresa_id),0) saldo_kg FROM armazens_agro a JOIN propriedades_rurais p ON p.id=a.propriedade_id WHERE a.empresa_id=? ORDER BY a.nome",empresa),"propriedade_id");
    }
    @Transactional public Map<String,Object> armazem(Long empresa,ProducaoIntegradaController.Armazem r) {
        acesso.escrita(empresa);
        acesso.permissoes().propriedade(empresa,r.propriedadeId());
        primeiro(db.queryForList("SELECT id FROM propriedades_rurais WHERE id=? AND empresa_id=?",r.propriedadeId(),empresa),"Propriedade não encontrada nesta empresa.");
        long id=acesso.inserir("INSERT INTO armazens_agro(empresa_id,propriedade_id,nome,capacidade_kg) VALUES(?,?,?,?)",empresa,r.propriedadeId(),r.nome().trim(),r.capacidadeKg());
        acesso.auditar(empresa,"CADASTRAR_ARMAZEM",id);return Map.of("id",id);
    }
    @Transactional public Map<String,Object> depositar(Long empresa,ProducaoIntegradaController.Deposito r) {
        acesso.escrita(empresa);
        acesso.permissoes().porOperacao(empresa,r.operacaoId());
        // Todos os depósitos bloqueiam primeiro o armazém e depois a colheita.
        var silo=armazemBloqueado(empresa,r.armazemId());
        var existente=db.queryForList("SELECT id,armazem_id,operacao_id FROM graos_agro WHERE empresa_id=? AND chave=?",empresa,r.chave());
        if(!existente.isEmpty()) {
            if(id(existente.getFirst(),"armazem_id")!=r.armazemId() || existente.getFirst().get("operacao_id")==null || id(existente.getFirst(),"operacao_id")!=r.operacaoId()) throw new IllegalArgumentException("Chave de reenvio já utilizada por outro registro.");
            return Map.of("id",existente.getFirst().get("id"));
        }
        var op=primeiro(db.queryForList("SELECT o.*,s.propriedade_id FROM operacoes_agro o JOIN safras_agro s ON s.id=o.safra_id WHERE o.id=? AND o.empresa_id=? AND o.tipo='COLHEITA' FOR UPDATE",r.operacaoId(),empresa),"Colheita não encontrada nesta empresa.");
        if(r.data().isBefore(LocalDate.parse(op.get("data_operacao").toString()))) throw new IllegalArgumentException("Depósito anterior à colheita.");
        BigDecimal alocado=db.queryForObject("SELECT COALESCE(SUM(quantidade_kg),0) FROM graos_agro WHERE operacao_id=? AND empresa_id=? AND quantidade_kg>0",BigDecimal.class,r.operacaoId(),empresa);
        if(alocado.add(r.quantidadeKg()).compareTo(decimal(op,"peso_liquido_kg"))>0) throw new IllegalArgumentException("Depósito excede a produção líquida ainda não armazenada.");
        BigDecimal saldo=db.queryForObject("SELECT COALESCE(SUM(quantidade_kg),0) FROM graos_agro WHERE armazem_id=? AND empresa_id=?",BigDecimal.class,r.armazemId(),empresa);
        if(saldo.add(r.quantidadeKg()).compareTo(decimal(silo,"capacidade_kg"))>0) throw new IllegalArgumentException("Capacidade do armazém excedida.");
        var datas=db.queryForList("SELECT DISTINCT data_registro FROM graos_agro WHERE armazem_id=? AND empresa_id=? AND data_registro>=?",r.armazemId(),empresa,r.data());
        for(var data:datas) {
            BigDecimal saldoNaData=db.queryForObject("SELECT COALESCE(SUM(quantidade_kg),0) FROM graos_agro WHERE armazem_id=? AND empresa_id=? AND data_registro<=?",BigDecimal.class,r.armazemId(),empresa,data.get("data_registro"));
            if(saldoNaData.add(r.quantidadeKg()).compareTo(decimal(silo,"capacidade_kg"))>0) throw new IllegalArgumentException("O depósito retroativo excederia a capacidade do armazém.");
        }
        long id=acesso.inserir("INSERT INTO graos_agro(empresa_id,armazem_id,safra_id,operacao_id,quantidade_kg,chave,data_registro) VALUES(?,?,?,?,?,?,?)",empresa,r.armazemId(),op.get("safra_id"),r.operacaoId(),r.quantidadeKg(),r.chave(),r.data());
        acesso.auditar(empresa,"ARMAZENAR_COLHEITA",id);return Map.of("id",id);
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> graos(Long empresa) {
        acesso.acesso(empresa);return acesso.permissoes().filtrar(empresa,db.queryForList("SELECT g.*,a.nome armazem,s.nome safra,s.cultura,s.propriedade_id FROM graos_agro g JOIN armazens_agro a ON a.id=g.armazem_id JOIN safras_agro s ON s.id=g.safra_id WHERE g.empresa_id=? ORDER BY g.id DESC",empresa),"propriedade_id");
    }
    @Transactional public Map<String,Object> entregar(Long empresa,ProducaoIntegradaController.Entrega r) {
        acesso.escrita(empresa);armazemBloqueado(empresa,r.armazemId());
        var existente=db.queryForList("SELECT id,armazem_id,contrato_id FROM entregas_agro WHERE empresa_id=? AND chave=?",empresa,r.chave());
        if(!existente.isEmpty()) {
            if(id(existente.getFirst(),"armazem_id")!=r.armazemId() || id(existente.getFirst(),"contrato_id")!=r.contratoId()) throw new IllegalArgumentException("Chave de reenvio já utilizada por outro registro.");
            return Map.of("id",existente.getFirst().get("id"));
        }
        var contrato=primeiro(db.queryForList("SELECT * FROM contratos_agro WHERE id=? AND empresa_id=? FOR UPDATE",r.contratoId(),empresa),"Contrato não encontrado nesta empresa.");
        acesso.permissoes().porSafra(empresa,id(contrato,"safra_id"));
        BigDecimal entregue=db.queryForObject("SELECT COALESCE(SUM(quantidade_kg),0) FROM entregas_agro WHERE contrato_id=? AND empresa_id=?",BigDecimal.class,r.contratoId(),empresa);
        if(entregue.add(r.quantidadeKg()).compareTo(decimal(contrato,"quantidade_kg"))>0) throw new IllegalArgumentException("Entrega excede o saldo do contrato.");
        BigDecimal estoque=db.queryForObject("SELECT COALESCE(SUM(quantidade_kg),0) FROM graos_agro WHERE armazem_id=? AND safra_id=? AND empresa_id=? AND data_registro<=?",BigDecimal.class,r.armazemId(),contrato.get("safra_id"),empresa,r.data());
        if(estoque.compareTo(r.quantidadeKg())<0) throw new IllegalArgumentException("Estoque da safra insuficiente no armazém e na data informada.");
        // Impede retirada retroativa que faria um saldo posterior ficar negativo.
        var futuros=db.queryForList("SELECT DISTINCT data_registro FROM graos_agro WHERE armazem_id=? AND safra_id=? AND empresa_id=? AND data_registro>?",r.armazemId(),contrato.get("safra_id"),empresa,r.data());
        for(var f:futuros) {
            BigDecimal saldoFuturo=db.queryForObject("SELECT COALESCE(SUM(quantidade_kg),0) FROM graos_agro WHERE armazem_id=? AND safra_id=? AND empresa_id=? AND data_registro<=?",BigDecimal.class,r.armazemId(),contrato.get("safra_id"),empresa,f.get("data_registro"));
            if(saldoFuturo.compareTo(r.quantidadeKg())<0) throw new IllegalArgumentException("A entrega retroativa deixaria o estoque negativo.");
        }
        BigDecimal valor=r.quantidadeKg().multiply(decimal(contrato,"preco_kg")).setScale(2,RoundingMode.HALF_UP);
        if(valor.signum()<=0) throw new IllegalArgumentException("Valor da entrega deve ser de pelo menos um centavo.");
        BigDecimal comissao=valor.multiply(decimal(contrato,"comissao_percentual")).movePointLeft(2).setScale(2,RoundingMode.HALF_UP);
        long id=acesso.inserir("INSERT INTO entregas_agro(empresa_id,contrato_id,armazem_id,chave,data_entrega,quantidade_kg,valor,comissao) VALUES(?,?,?,?,?,?,?,?)",empresa,r.contratoId(),r.armazemId(),r.chave(),r.data(),r.quantidadeKg(),valor,comissao);
        db.update("INSERT INTO graos_agro(empresa_id,armazem_id,safra_id,entrega_id,quantidade_kg,chave,data_registro) VALUES(?,?,?,?,?,?,?)",empresa,r.armazemId(),contrato.get("safra_id"),id,r.quantidadeKg().negate(),"entrega-"+id,r.data());
        acesso.auditar(empresa,"ENTREGAR_CONTRATO",id);return Map.of("id",id,"valor",valor,"comissao",comissao);
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> entregas(Long empresa) {
        acesso.acesso(empresa);return acesso.permissoes().filtrar(empresa,db.queryForList("SELECT e.*,c.numero contrato,c.contraparte,c.safra_id,s.nome safra,s.propriedade_id,m.excluida receita_excluida,mc.excluida comissao_excluida FROM entregas_agro e JOIN contratos_agro c ON c.id=e.contrato_id JOIN safras_agro s ON s.id=c.safra_id LEFT JOIN movimentacoes m ON m.id=e.receita_id LEFT JOIN movimentacoes mc ON mc.id=e.comissao_id WHERE e.empresa_id=? ORDER BY e.id DESC",empresa),"propriedade_id");
    }
    private Long lancar(Long empresa,long safra,String origem,String descricao,BigDecimal valor,TipoMovimentacao tipo,Long categoria,LocalDate data) {
        var request=new CriarMovimentacaoRequest(descricao,valor,tipo,categoria,data,origem,null,null,null,null,null,null,null,null);
        Long id=financeiro.criar(empresa,request).id();
        vincular(empresa,safra,id,origem);return id;
    }
    private void vincular(Long empresa,long safra,Long movimento,String origem) {
        db.update("INSERT INTO lancamentos_agro(empresa_id,safra_id,movimentacao_id,origem) VALUES(?,?,?,?)",empresa,safra,movimento,origem);
        db.update("UPDATE movimentacoes SET propriedade_rural_id=(SELECT propriedade_id FROM safras_agro WHERE id=? AND empresa_id=?) WHERE id=? AND empresa_id=?",safra,empresa,movimento,empresa);
    }
    @Transactional public Map<String,Object> liquidar(Long empresa,Long entregaId,ProducaoIntegradaController.Liquidacao r) {
        acesso.escrita(empresa);
        acesso.permissoes().financeiro(empresa);
        var e=primeiro(db.queryForList("SELECT e.*,c.safra_id FROM entregas_agro e JOIN contratos_agro c ON c.id=e.contrato_id WHERE e.id=? AND e.empresa_id=? FOR UPDATE",entregaId,empresa),"Entrega não encontrada nesta empresa.");
        acesso.permissoes().porSafra(empresa,id(e,"safra_id"));
        if(r.data().isBefore(LocalDate.parse(e.get("data_entrega").toString()))) throw new IllegalArgumentException("Liquidação anterior à entrega.");
        if(r.categoriaReceitaId()==null && r.categoriaComissaoId()==null) throw new IllegalArgumentException("Confirme o recebimento ou o pagamento da comissão.");
        if(r.categoriaReceitaId()!=null && e.get("receita_id")!=null && Boolean.TRUE.equals(db.queryForObject("SELECT excluida FROM movimentacoes WHERE id=? AND empresa_id=?",Boolean.class,e.get("receita_id"),empresa))) throw new IllegalArgumentException("O recebimento vinculado está na lixeira. Restaure ou corrija a movimentação existente antes de confirmar.");
        if(r.categoriaComissaoId()!=null && e.get("comissao_id")!=null && Boolean.TRUE.equals(db.queryForObject("SELECT excluida FROM movimentacoes WHERE id=? AND empresa_id=?",Boolean.class,e.get("comissao_id"),empresa))) throw new IllegalArgumentException("A comissão vinculada está na lixeira. Restaure ou corrija a movimentação existente antes de confirmar.");
        if(r.categoriaReceitaId()!=null && e.get("receita_id")==null) {
            Long id=lancar(empresa,id(e,"safra_id"),"ENTREGA","Recebimento da entrega #"+entregaId,decimal(e,"valor"),TipoMovimentacao.RECEITA,r.categoriaReceitaId(),r.data());
            db.update("UPDATE entregas_agro SET receita_id=? WHERE id=? AND empresa_id=?",id,entregaId,empresa);
        }
        if(r.categoriaComissaoId()!=null && e.get("comissao_id")==null) {
            if(decimal(e,"comissao").signum()<=0) throw new IllegalArgumentException("Esta entrega não possui comissão a pagar.");
            Long id=lancar(empresa,id(e,"safra_id"),"COMISSAO","Comissão da entrega #"+entregaId,decimal(e,"comissao"),TipoMovimentacao.DESPESA,r.categoriaComissaoId(),r.data());
            db.update("UPDATE entregas_agro SET comissao_id=? WHERE id=? AND empresa_id=?",id,entregaId,empresa);
        }
        acesso.auditar(empresa,"LIQUIDAR_ENTREGA",entregaId);return Map.of("salvo",true);
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> maquinas(Long empresa) {
        acesso.acesso(empresa);return acesso.permissoes().filtrar(empresa,db.queryForList("SELECT m.*,p.nome propriedade,CASE WHEN m.proxima_manutencao IS NOT NULL AND m.horimetro>=m.proxima_manutencao THEN true ELSE false END manutencao_pendente FROM maquinas_agro m JOIN propriedades_rurais p ON p.id=m.propriedade_id WHERE m.empresa_id=? ORDER BY m.nome",empresa),"propriedade_id");
    }
    @Transactional public Map<String,Object> maquina(Long empresa,ProducaoIntegradaController.Maquina r) {
        acesso.escrita(empresa);
        acesso.permissoes().propriedade(empresa,r.propriedadeId());
        primeiro(db.queryForList("SELECT id FROM propriedades_rurais WHERE id=? AND empresa_id=?",r.propriedadeId(),empresa),"Propriedade não encontrada nesta empresa.");
        if(r.proximaManutencao()!=null && r.proximaManutencao().compareTo(r.horimetro())<0) throw new IllegalArgumentException("Próxima manutenção anterior ao horímetro atual.");
        long id=acesso.inserir("INSERT INTO maquinas_agro(empresa_id,propriedade_id,nome,identificacao,horimetro,proxima_manutencao) VALUES(?,?,?,?,?,?)",empresa,r.propriedadeId(),r.nome().trim(),r.identificacao().trim(),r.horimetro(),r.proximaManutencao());
        acesso.auditar(empresa,"CADASTRAR_MAQUINA",id);return Map.of("id",id);
    }
    @Transactional public Map<String,Object> usar(Long empresa,ProducaoIntegradaController.Uso r) {
        acesso.escrita(empresa);
        acesso.permissoes().porOperacao(empresa,r.operacaoId());
        var maquina=primeiro(db.queryForList("SELECT * FROM maquinas_agro WHERE id=? AND empresa_id=? FOR UPDATE",r.maquinaId(),empresa),"Máquina não encontrada nesta empresa.");
        acesso.permissoes().propriedade(empresa,id(maquina,"propriedade_id"));
        var existente=db.queryForList("SELECT id,maquina_id,operacao_id FROM usos_maquinas_agro WHERE empresa_id=? AND chave=?",empresa,r.chave());
        if(!existente.isEmpty()) {
            if(id(existente.getFirst(),"maquina_id")!=r.maquinaId() || id(existente.getFirst(),"operacao_id")!=r.operacaoId()) throw new IllegalArgumentException("Chave de reenvio já utilizada por outro registro.");
            return Map.of("id",existente.getFirst().get("id"));
        }
        var op=primeiro(db.queryForList("SELECT o.*,s.propriedade_id FROM operacoes_agro o JOIN safras_agro s ON s.id=o.safra_id WHERE o.id=? AND o.empresa_id=?",r.operacaoId(),empresa),"Operação não encontrada nesta empresa.");
        if(id(maquina,"propriedade_id")!=id(op,"propriedade_id")) throw new IllegalArgumentException("Máquina e operação devem pertencer à mesma propriedade.");
        BigDecimal novoHorimetro=decimal(maquina,"horimetro").add(r.horas());
        if(r.proximaManutencao()!=null && r.proximaManutencao().compareTo(novoHorimetro)<=0) throw new IllegalArgumentException("Próxima manutenção deve ser posterior ao novo horímetro.");
        if(r.combustivelLitros().signum()>0) {
            if(r.insumoCombustivelId()==null) throw new IllegalArgumentException("Selecione o combustível do estoque para registrar o consumo.");
            var combustivel=primeiro(db.queryForList("SELECT * FROM insumos_agro WHERE id=? AND empresa_id=? AND tipo='COMBUSTIVEL' FOR UPDATE",r.insumoCombustivelId(),empresa),"Combustível não encontrado nesta empresa.");
            if(!Set.of("l","litro","litros").contains(combustivel.get("unidade").toString().toLowerCase(Locale.ROOT).trim())) throw new IllegalArgumentException("O combustível deve estar cadastrado em litros.");
            if(decimal(combustivel,"saldo").compareTo(r.combustivelLitros())<0) throw new IllegalArgumentException("Saldo de combustível insuficiente.");
        }
        Long movimento=null;
        if(r.financeiro()!=null) {
            acesso.permissoes().financeiro(empresa);
            if(r.financeiro().tipo()!=TipoMovimentacao.DESPESA) throw new IllegalArgumentException("Custo de máquina deve ser uma despesa.");
            if(!r.financeiro().dataMovimentacao().equals(LocalDate.parse(op.get("data_operacao").toString()))) throw new IllegalArgumentException("Data do custo deve coincidir com a operação.");
            movimento=financeiro.criar(empresa,r.financeiro()).id();vincular(empresa,id(op,"safra_id"),movimento,"MAQUINA");
        }
        long id=acesso.inserir("INSERT INTO usos_maquinas_agro(empresa_id,maquina_id,operacao_id,chave,tipo,horas,combustivel_litros,movimentacao_id,observacao) VALUES(?,?,?,?,?,?,?,?,?)",empresa,r.maquinaId(),r.operacaoId(),r.chave(),r.tipo(),r.horas(),r.combustivelLitros(),movimento,r.observacao());
        db.update("UPDATE maquinas_agro SET horimetro=horimetro+? WHERE id=? AND empresa_id=?",r.horas(),r.maquinaId(),empresa);
        if(r.proximaManutencao()!=null) db.update("UPDATE maquinas_agro SET proxima_manutencao=? WHERE id=? AND empresa_id=?",r.proximaManutencao(),r.maquinaId(),empresa);
        if(r.combustivelLitros().signum()>0) {
            db.update("UPDATE insumos_agro SET saldo=saldo-? WHERE id=? AND empresa_id=?",r.combustivelLitros(),r.insumoCombustivelId(),empresa);
            db.update("INSERT INTO estoque_agro(empresa_id,insumo_id,operacao_id,chave,tipo,quantidade,data_registro,observacao) VALUES(?,?,?,?,'SAIDA',?,?,?)",empresa,r.insumoCombustivelId(),r.operacaoId(),"maquina-"+id,r.combustivelLitros(),op.get("data_operacao"),"Consumo vinculado ao uso de máquina #"+id);
        }
        acesso.auditar(empresa,"REGISTRAR_USO_MAQUINA",id);return Map.of("id",id);
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> usos(Long empresa) {
        acesso.acesso(empresa);return acesso.permissoes().filtrar(empresa,db.queryForList("SELECT u.*,m.nome maquina,m.propriedade_id,o.data_operacao FROM usos_maquinas_agro u JOIN maquinas_agro m ON m.id=u.maquina_id JOIN operacoes_agro o ON o.id=u.operacao_id WHERE u.empresa_id=? ORDER BY u.id DESC",empresa),"propriedade_id");
    }
}
