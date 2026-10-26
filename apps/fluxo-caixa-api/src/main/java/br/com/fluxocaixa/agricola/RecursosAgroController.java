package br.com.fluxocaixa.agricola;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola")
public class RecursosAgroController {
    private final AgricolaService acesso;
    private final JdbcTemplate db;
    public RecursosAgroController(AgricolaService acesso,JdbcTemplate db) { this.acesso=acesso;this.db=db; }
    public record Insumo(@NotBlank @Size(max=120) String nome,@NotBlank @Pattern(regexp="SEMENTE|DEFENSIVO|FERTILIZANTE|COMBUSTIVEL|OUTRO") String tipo,@NotBlank @Size(max=20) String unidade) {}
    public record Estoque(@NotNull @Positive Long insumoId,Long operacaoId,@NotBlank @Pattern(regexp="[a-zA-Z0-9-]{8,64}") String chave,
            @NotBlank @Pattern(regexp="ENTRADA|SAIDA") String tipo,@NotNull @DecimalMin("0.0001") @Digits(integer=15,fraction=4) BigDecimal quantidade,
            @NotNull @PastOrPresent LocalDate data,@NotBlank @Size(max=300) String observacao) {}
    public record Contrato(@NotNull @Positive Long safraId,@NotBlank @Size(max=80) String numero,@NotBlank @Size(max=150) String contraparte,
            @NotNull @DecimalMin("0.001") @Digits(integer=16,fraction=3) BigDecimal quantidadeKg,
            @NotNull @DecimalMin("0.0001") @Digits(integer=15,fraction=4) BigDecimal precoKg,
            @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=4) BigDecimal comissaoPercentual,@NotNull LocalDate vencimento) {}
    public record LinhaExtrato(@NotBlank @Size(max=100) String referencia,@NotBlank @Size(max=150) String descricao,
            @NotNull @PastOrPresent LocalDate data,@NotNull @Digits(integer=17,fraction=2) BigDecimal valor) {}
    public record Extrato(@NotBlank @Size(max=100) String conta,@NotEmpty @Size(max=500) List<@Valid LinhaExtrato> linhas) {}
    public record Conciliacao(@NotNull @Positive Long movimentacaoId) {}
    @GetMapping("/insumos") public List<Map<String,Object>> insumos(@PathVariable Long empresaId) {
        acesso.acesso(empresaId);return db.queryForList("SELECT * FROM insumos_agro WHERE empresa_id=? ORDER BY nome",empresaId);
    }
    @PostMapping("/insumos") @Transactional public Map<String,Object> insumo(@PathVariable Long empresaId,@Valid @RequestBody Insumo r) {
        acesso.escrita(empresaId);
        db.update("INSERT INTO insumos_agro(empresa_id,nome,tipo,unidade) VALUES(?,?,?,?)",empresaId,r.nome().trim(),r.tipo(),r.unidade().trim());
        acesso.auditar(empresaId,"CADASTRAR_INSUMO",null); return Map.of("salvo",true);
    }
    @GetMapping("/estoque") public List<Map<String,Object>> estoque(@PathVariable Long empresaId) {
        acesso.acesso(empresaId);
        var linhas=db.queryForList("SELECT e.*,i.nome,i.unidade,s.propriedade_id FROM estoque_agro e JOIN insumos_agro i ON i.id=e.insumo_id LEFT JOIN operacoes_agro o ON o.id=e.operacao_id LEFT JOIN safras_agro s ON s.id=o.safra_id WHERE e.empresa_id=? ORDER BY e.id DESC LIMIT 500",empresaId);
        if(!acesso.permissoes().restrito(empresaId)) return linhas;
        var permitidas=acesso.permissoes().filtrar(empresaId,linhas,"propriedade_id");
        return linhas.stream().filter(l->l.get("operacao_id")==null || permitidas.contains(l)).toList();
    }
    @PostMapping("/estoque") @Transactional public Map<String,Object> estoque(@PathVariable Long empresaId,@Valid @RequestBody Estoque r) {
        acesso.escrita(empresaId);
        var itens=db.queryForList("SELECT saldo FROM insumos_agro WHERE id=? AND empresa_id=? FOR UPDATE",r.insumoId(),empresaId);
        if(itens.isEmpty()) throw new IllegalArgumentException("Insumo não encontrado nesta empresa.");
        if(!db.queryForList("SELECT id FROM estoque_agro WHERE empresa_id=? AND chave=?",empresaId,r.chave()).isEmpty()) return Map.of("salvo",true);
        if(r.tipo().equals("SAIDA") && r.operacaoId()==null) throw new IllegalArgumentException("Associe a saída a uma operação agrícola.");
        if(r.operacaoId()!=null) acesso.permissoes().porOperacao(empresaId,r.operacaoId());
        if(r.operacaoId()!=null && db.queryForList("SELECT id FROM operacoes_agro WHERE id=? AND empresa_id=?",r.operacaoId(),empresaId).isEmpty())
            throw new IllegalArgumentException("Operação não encontrada nesta empresa.");
        BigDecimal delta=r.tipo().equals("ENTRADA") ? r.quantidade() : r.quantidade().negate();
        if(((BigDecimal)itens.getFirst().get("saldo")).add(delta).signum()<0) throw new IllegalArgumentException("Saldo insuficiente. Confira as entradas do insumo.");
        db.update("INSERT INTO estoque_agro(empresa_id,insumo_id,operacao_id,chave,tipo,quantidade,data_registro,observacao) VALUES(?,?,?,?,?,?,?,?)",
                empresaId,r.insumoId(),r.operacaoId(),r.chave(),r.tipo(),r.quantidade(),r.data(),r.observacao());
        db.update("UPDATE insumos_agro SET saldo=saldo+? WHERE id=? AND empresa_id=?",delta,r.insumoId(),empresaId);
        acesso.auditar(empresaId,"MOVIMENTAR_ESTOQUE",r.insumoId());return Map.of("salvo",true);
    }
    @GetMapping("/contratos") public List<Map<String,Object>> contratos(@PathVariable Long empresaId) {
        acesso.acesso(empresaId);return acesso.permissoes().filtrar(empresaId,db.queryForList("SELECT c.*,s.nome safra,s.propriedade_id,c.quantidade_kg*c.preco_kg valor_previsto,c.quantidade_kg*c.preco_kg*c.comissao_percentual/100 comissao_prevista FROM contratos_agro c JOIN safras_agro s ON s.id=c.safra_id WHERE c.empresa_id=? ORDER BY c.vencimento",empresaId),"propriedade_id");
    }
    @PostMapping("/contratos") @Transactional public Map<String,Object> contrato(@PathVariable Long empresaId,@Valid @RequestBody Contrato r) {
        acesso.escrita(empresaId);
        acesso.permissoes().porSafra(empresaId,r.safraId());
        if(db.queryForList("SELECT id FROM safras_agro WHERE id=? AND empresa_id=?",r.safraId(),empresaId).isEmpty()) throw new IllegalArgumentException("Safra não encontrada nesta empresa.");
        db.update("INSERT INTO contratos_agro(empresa_id,safra_id,numero,contraparte,quantidade_kg,preco_kg,comissao_percentual,vencimento) VALUES(?,?,?,?,?,?,?,?)",
                empresaId,r.safraId(),r.numero().trim(),r.contraparte().trim(),r.quantidadeKg(),r.precoKg(),r.comissaoPercentual(),r.vencimento());
        acesso.auditar(empresaId,"REGISTRAR_CONTRATO",null);return Map.of("salvo",true);
    }
    @GetMapping("/extrato") public List<Map<String,Object>> extrato(@PathVariable Long empresaId) {
        acesso.acesso(empresaId);return db.queryForList("SELECT e.*,m.excluida movimentacao_excluida FROM extrato_agro e LEFT JOIN movimentacoes m ON m.id=e.movimentacao_id AND m.empresa_id=e.empresa_id WHERE e.empresa_id=? ORDER BY e.data_registro DESC,e.id DESC LIMIT 500",empresaId);
    }
    @PostMapping(value="/extrato/ofx",consumes="multipart/form-data") @Transactional
    public Map<String,Object> importarOfx(@PathVariable Long empresaId,@RequestPart("arquivo") org.springframework.web.multipart.MultipartFile arquivo) {
        acesso.escrita(empresaId);
        if(arquivo.getSize()>2_000_000) throw new IllegalArgumentException("Envie um OFX com até 2 MB.");
        try { return importar(empresaId,ExtratoOfxParser.ler(arquivo.getBytes())); }
        catch(java.io.IOException e) { throw new IllegalArgumentException("Não foi possível ler o OFX."); }
    }
    @PostMapping("/extrato") @Transactional public Map<String,Object> importar(@PathVariable Long empresaId,@Valid @RequestBody Extrato r) {
        acesso.escrita(empresaId);int importadas=0;
        for(var linha:r.linhas()) {
            if(linha.valor().signum()==0) throw new IllegalArgumentException("Extrato contém valor zero.");
            if(!db.queryForList("SELECT id FROM extrato_agro WHERE empresa_id=? AND conta=? AND referencia=?",empresaId,r.conta(),linha.referencia()).isEmpty()) continue;
            db.update("INSERT INTO extrato_agro(empresa_id,conta,referencia,descricao,data_registro,valor) VALUES(?,?,?,?,?,?)",empresaId,r.conta(),linha.referencia(),linha.descricao(),linha.data(),linha.valor());importadas++;
        }
        acesso.auditar(empresaId,"IMPORTAR_EXTRATO",null);return Map.of("importadas",importadas);
    }
    @GetMapping("/extrato/{id}/sugestoes") public List<Map<String,Object>> sugestoes(@PathVariable Long empresaId,@PathVariable Long id) {
        acesso.acesso(empresaId);
        return db.queryForList("""
            SELECT m.id,m.descricao,m.valor,m.tipo,m.data_movimentacao FROM movimentacoes m
            JOIN extrato_agro e ON e.empresa_id=m.empresa_id AND e.id=?
            WHERE m.empresa_id=? AND m.excluida=false AND m.data_movimentacao=e.data_registro
            AND m.valor=ABS(e.valor) AND m.tipo=CASE WHEN e.valor>0 THEN 'RECEITA' ELSE 'DESPESA' END
            AND NOT EXISTS(SELECT 1 FROM extrato_agro x WHERE x.movimentacao_id=m.id)
            """,id,empresaId);
    }
    @PostMapping("/extrato/{id}/conciliar") @Transactional public Map<String,Object> conciliar(@PathVariable Long empresaId,@PathVariable Long id,@Valid @RequestBody Conciliacao r) {
        acesso.escrita(empresaId);
        var linhas=db.queryForList("SELECT * FROM extrato_agro WHERE id=? AND empresa_id=? FOR UPDATE",id,empresaId);
        if(linhas.isEmpty()) throw new IllegalArgumentException("Lançamento bancário não encontrado.");
        var linha=linhas.getFirst();
        if(linha.get("movimentacao_id")!=null) throw new IllegalArgumentException("Lançamento já conciliado.");
        if(sugestoes(empresaId,id).stream().noneMatch(m->((Number)m.get("id")).longValue()==r.movimentacaoId()))
            throw new IllegalArgumentException("Movimentação incompatível: confira empresa, data, valor, tipo e conciliação anterior.");
        db.update("UPDATE extrato_agro SET movimentacao_id=? WHERE id=? AND empresa_id=?",r.movimentacaoId(),id,empresaId);
        acesso.auditar(empresaId,"CONCILIAR_EXTRATO",id);return Map.of("salvo",true);
    }
}
