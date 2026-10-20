package br.com.fluxocaixa.agricola;

import br.com.fluxocaixa.colaboracao.*;
import br.com.fluxocaixa.movimentacao.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Statement;
import java.util.*;

@Service
public class AgricolaService {
    private final JdbcTemplate db;
    private final ColaboracaoService colaboracao;
    private final MovimentacaoService financeiro;
    private final ExtratorRomaneio extrator;
    private final PermissoesAgroService permissoes;
    public PermissoesAgroService permissoes() { return permissoes; }
    public AgricolaService(JdbcTemplate db, ColaboracaoService colaboracao, MovimentacaoService financeiro, ExtratorRomaneio extrator,PermissoesAgroService permissoes) {
        this.db=db; this.colaboracao=colaboracao; this.financeiro=financeiro; this.extrator=extrator;
        this.permissoes=permissoes;
    }
    void acesso(Long empresa) {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)
                || !String.valueOf(empresa).equals(String.valueOf(jwt.getClaims().get("empresaId"))))
            throw new AccessDeniedException("Sem acesso à empresa.");
        permissoes.exigirFuncao(empresa,false);
    }
    void escrita(Long empresa) {
        acesso(empresa);
        Jwt jwt=(Jwt)SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        permissoes.exigirFuncao(empresa,true);
        boolean padrao=Set.of("PROPRIETARIO","PRODUTOR","ADMINISTRADOR","SUPER_ADMIN").contains(jwt.getClaimAsString("papel"));
        if (!permissoes.regra(empresa,permissoes.funcaoAtual(),true).orElse(padrao))
            throw new AccessDeniedException("O registro agrícola exige perfil de produtor ou administrador.");
    }
    void auditar(Long empresa, String acao, Long id) {
        Jwt jwt=(Jwt)SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        db.update("INSERT INTO auditoria_agro (empresa_id,usuario_id,acao,entidade,entidade_id,detalhes,criado_em) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)",
                empresa,jwt.getClaims().get("usuarioId"),acao,"AGRICOLA",id,"Registro agrícola");
    }
    long inserir(String sql, Object... args) {
        var key=new GeneratedKeyHolder();
        db.update(c -> { var ps=c.prepareStatement(sql,new String[]{"id"});
            for(int i=0;i<args.length;i++) ps.setObject(i+1,args[i]); return ps; },key);
        return Objects.requireNonNull(key.getKey()).longValue();
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> safras(Long empresa) {
        acesso(empresa);
        var resultado=permissoes.filtrar(empresa,db.queryForList("""
            SELECT s.*, p.nome propriedade,
              COALESCE(SUM(CASE WHEN o.tipo='COLHEITA' THEN o.peso_liquido_kg ELSE 0 END),0) producao_kg,
              COALESCE(SUM(CASE WHEN o.tipo='COLHEITA' THEN o.peso_liquido_kg ELSE 0 END),0)/s.area_hectares produtividade_kg_ha,
              COALESCE((SELECT SUM(m.valor) FROM lancamentos_agro l JOIN movimentacoes m ON m.id=l.movimentacao_id AND m.empresa_id=l.empresa_id WHERE l.safra_id=s.id AND l.empresa_id=s.empresa_id AND m.tipo='DESPESA' AND m.excluida=false),0) custos,
              COALESCE((SELECT SUM(m.valor) FROM lancamentos_agro l JOIN movimentacoes m ON m.id=l.movimentacao_id AND m.empresa_id=l.empresa_id WHERE l.safra_id=s.id AND l.empresa_id=s.empresa_id AND m.tipo='RECEITA' AND m.excluida=false),0) receitas
            FROM safras_agro s JOIN propriedades_rurais p ON p.id=s.propriedade_id
            LEFT JOIN operacoes_agro o ON o.safra_id=s.id AND o.empresa_id=s.empresa_id
            WHERE s.empresa_id=? GROUP BY s.id,p.nome ORDER BY s.inicio DESC,s.id DESC
            """,empresa),"propriedade_id");
        if(permissoes.regra(empresa,"FINANCEIRO",false).filter(p->!p).isPresent()) resultado.forEach(r->{r.remove("custos");r.remove("receitas");});
        return resultado;
    }
    @Transactional
    public Map<String,Object> criarSafra(Long empresa,AgricolaController.Safra r) {
        escrita(empresa);
        permissoes.propriedade(empresa,r.propriedadeId());
        if(r.fim().isBefore(r.inicio())) throw new IllegalArgumentException("Fim da safra anterior ao início.");
        var propriedades=colaboracao.listarPropriedades(empresa);
        var propriedade=propriedades.stream().filter(p->p.id().equals(r.propriedadeId())).findFirst()
                .orElseThrow(()->new IllegalArgumentException("Propriedade não encontrada nesta empresa."));
        if(propriedade.areaHectares()!=null && r.areaHectares().compareTo(propriedade.areaHectares())>0)
            throw new IllegalArgumentException("Área do talhão excede a área da propriedade.");
        long id=inserir("INSERT INTO safras_agro (empresa_id,propriedade_id,nome,cultura,talhao,area_hectares,inicio,fim) VALUES (?,?,?,?,?,?,?,?)",
                empresa,r.propriedadeId(),r.nome().trim(),r.cultura().trim(),r.talhao().trim(),r.areaHectares(),r.inicio(),r.fim());
        auditar(empresa,"CRIAR_SAFRA",id); return Map.of("id",id);
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> operacoes(Long empresa) {
        acesso(empresa);
        return permissoes.filtrar(empresa,db.queryForList("SELECT o.*,s.nome safra,s.propriedade_id FROM operacoes_agro o JOIN safras_agro s ON s.id=o.safra_id WHERE o.empresa_id=? ORDER BY o.data_operacao DESC,o.id DESC",empresa),"propriedade_id");
    }
    @Transactional
    public Map<String,Object> criarOperacao(Long empresa,AgricolaController.Operacao r) {
        escrita(empresa);
        permissoes.porSafra(empresa,r.safraId());
        var safras=db.queryForList("SELECT * FROM safras_agro WHERE id=? AND empresa_id=? FOR UPDATE",r.safraId(),empresa);
        if(safras.isEmpty()) throw new IllegalArgumentException("Safra não encontrada nesta empresa.");
        var existente=db.queryForList("SELECT id,safra_id FROM operacoes_agro WHERE empresa_id=? AND chave=?",empresa,r.chave());
        if(!existente.isEmpty()) {
            if(((Number)existente.getFirst().get("safra_id")).longValue()!=r.safraId()) throw new IllegalArgumentException("Chave de reenvio já utilizada por outro registro.");
            return Map.of("id",existente.getFirst().get("id"));
        }
        var safra=safras.getFirst();
        var inicio=java.time.LocalDate.parse(safra.get("inicio").toString());
        var fim=java.time.LocalDate.parse(safra.get("fim").toString());
        if(r.data().isBefore(inicio)||r.data().isAfter(fim)) throw new IllegalArgumentException("Data fora do período da safra.");
        boolean colheita=r.tipo().equals("COLHEITA");
        if(colheita && r.quantidadeKg().signum()<=0) throw new IllegalArgumentException("Informe o peso da colheita.");
        if(r.romaneioId()!=null) {
            if(!colheita) throw new IllegalArgumentException("Romaneio deve ser associado a uma colheita.");
            var docs=db.queryForList("SELECT id,status,propriedade_id FROM romaneios_agro WHERE id=? AND empresa_id=? FOR UPDATE",r.romaneioId(),empresa);
            if(docs.isEmpty() || !"CONFERIR".equals(docs.getFirst().get("status"))) throw new IllegalArgumentException("Romaneio não disponível para validação.");
            if(docs.getFirst().get("propriedade_id") instanceof Number p && p.longValue()!=((Number)safra.get("propriedade_id")).longValue()) throw new IllegalArgumentException("Romaneio e safra pertencem a propriedades diferentes.");
            permissoes.propriedade(empresa,docs.getFirst().get("propriedade_id") instanceof Number p ? p.longValue() : null);
        }
        BigDecimal tara=r.taraKg()==null ? BigDecimal.ZERO : r.taraKg();
        if(tara.compareTo(r.quantidadeKg())>0) throw new IllegalArgumentException("A tara não pode exceder o peso bruto.");
        BigDecimal liquido=colheita ? PesoRomaneio.liquido(r.quantidadeKg(),tara,r.impurezas(),r.descontoKg()) : BigDecimal.ZERO;
        Long movimento=null;
        if(r.financeiro()!=null) {
            permissoes.financeiro(empresa);
            if(!r.financeiro().dataMovimentacao().equals(r.data())) throw new IllegalArgumentException("Data financeira deve coincidir com a operação.");
            movimento=financeiro.criar(empresa,r.financeiro()).id();
            db.update("INSERT INTO lancamentos_agro(empresa_id,safra_id,movimentacao_id,origem) VALUES(?,?,?,'OPERACAO')",empresa,r.safraId(),movimento);
            db.update("UPDATE movimentacoes SET propriedade_rural_id=? WHERE id=? AND empresa_id=?",safra.get("propriedade_id"),movimento,empresa);
        }
        long id=inserir("""
            INSERT INTO operacoes_agro (empresa_id,safra_id,romaneio_id,movimentacao_id,chave,tipo,descricao,data_operacao,
              quantidade_kg,umidade,impurezas,desconto_kg,peso_liquido_kg,tara_kg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,empresa,r.safraId(),r.romaneioId(),movimento,r.chave(),r.tipo(),r.descricao().trim(),r.data(),r.quantidadeKg(),r.umidade(),r.impurezas(),r.descontoKg(),liquido,tara);
        if(r.romaneioId()!=null) {
            db.update("UPDATE romaneios_agro SET status='VALIDADO' WHERE id=? AND empresa_id=?",r.romaneioId(),empresa);
            if(movimento!=null) db.update("UPDATE documentos_agro SET movimentacao_id=? WHERE id=(SELECT documento_id FROM romaneios_agro WHERE id=? AND empresa_id=?)",movimento,r.romaneioId(),empresa);
        }
        auditar(empresa,"REGISTRAR_OPERACAO",id); return Map.of("id",id,"pesoLiquidoKg",liquido);
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> romaneios(Long empresa) {
        acesso(empresa);
        return permissoes.filtrar(empresa,db.queryForList("SELECT r.*,d.nome_arquivo FROM romaneios_agro r JOIN documentos_agro d ON d.id=r.documento_id WHERE r.empresa_id=? ORDER BY r.id DESC",empresa),"propriedade_id");
    }
    @Transactional(readOnly=true)
    public DocumentoAgro arquivoRomaneio(Long empresa,Long romaneio) {
        acesso(empresa);
        var rows=db.queryForList("SELECT documento_id,propriedade_id FROM romaneios_agro WHERE id=? AND empresa_id=?",romaneio,empresa);
        if(rows.isEmpty()) throw new IllegalArgumentException("Romaneio não encontrado.");
        var row=rows.getFirst();permissoes.propriedade(empresa,row.get("propriedade_id") instanceof Number p ? p.longValue() : null);
        return colaboracao.obterDocumento(empresa,((Number)row.get("documento_id")).longValue());
    }
    @Transactional
    public Map<String,Object> importar(Long empresa,MultipartFile arquivo) {
        return importar(empresa,arquivo,null);
    }
    @Transactional
    public Map<String,Object> importar(Long empresa,MultipartFile arquivo,Long propriedadeId) {
        escrita(empresa);
        permissoes.propriedade(empresa,propriedadeId);
        if(propriedadeId!=null && db.queryForList("SELECT id FROM propriedades_rurais WHERE id=? AND empresa_id=?",propriedadeId,empresa).isEmpty()) throw new IllegalArgumentException("Propriedade não encontrada nesta empresa.");
        if(arquivo.isEmpty()||arquivo.getSize()>10*1024*1024) throw new IllegalArgumentException("Envie um PDF, JPEG ou PNG com até 10 MB.");
        try {
            byte[] bytes=arquivo.getBytes();
            boolean pdf=bytes.length>4 && new String(bytes,0,5,StandardCharsets.US_ASCII).equals("%PDF-");
            boolean png=bytes.length>8 && bytes[0]==(byte)137 && bytes[1]==80 && bytes[2]==78 && bytes[3]==71;
            boolean jpg=bytes.length>3 && bytes[0]==(byte)255 && bytes[1]==(byte)216 && bytes[2]==(byte)255;
            if(!pdf&&!png&&!jpg) throw new IllegalArgumentException("Conteúdo inválido: use PDF, JPEG ou PNG.");
            String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            var existentes=permissoes.filtrar(empresa,db.queryForList("SELECT id,status,propriedade_id FROM romaneios_agro WHERE empresa_id=? AND hash_arquivo=?",empresa,hash),"propriedade_id");
            if(!existentes.isEmpty()) return existentes.getFirst();
            String texto=extrator.extrair(bytes,pdf ? ".pdf" : png ? ".png" : ".jpg");
            Map<String,String> sugestoes=extrator.sugerirIa(bytes,pdf,texto);
            String sugestoesJson=new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(sugestoes);
            var documento=colaboracao.enviarDocumento(empresa,null,TipoDocumentoAgro.OUTRO,"Romaneio: conferir antes de registrar a colheita.",arquivo);
            long id=inserir("INSERT INTO romaneios_agro (empresa_id,documento_id,hash_arquivo,texto_extraido,sugestoes_json,propriedade_id) VALUES (?,?,?,?,?,?)",empresa,documento.id(),hash,texto,sugestoesJson,propriedadeId);
            auditar(empresa,"IMPORTAR_ROMANEIO",id);
            return Map.of("id",id,"status","CONFERIR","texto_extraido",texto,"sugestoes",sugestoes.isEmpty() ? extrator.sugerir(texto) : sugestoes);
        } catch(java.io.IOException|java.security.NoSuchAlgorithmException e) { throw new IllegalArgumentException("Não foi possível ler o documento.",e); }
    }
}
