package br.com.fluxocaixa.agricola;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.*;
import java.util.*;

@Service
public class PermissoesAgroService {
    private final JdbcTemplate db;
    public static final Set<String> FUNCOES=Set.of("PRODUCAO","ESTOQUE","CONTRATOS","FROTA","FINANCEIRO","DOCUMENTOS","CLIMA","COTACOES");
    public PermissoesAgroService(JdbcTemplate db) { this.db=db; }
    Jwt jwt() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if(auth==null || !(auth.getPrincipal() instanceof Jwt jwt)) throw new AccessDeniedException("Usuário não autenticado.");return jwt;
    }
    long usuario() { return Long.parseLong(jwt().getClaims().get("usuarioId").toString()); }
    boolean administrador() { return Set.of("ADMINISTRADOR","SUPER_ADMIN","PROPRIETARIO").contains(jwt().getClaimAsString("papel")); }
    public String funcao(String caminho) {
        if(caminho.contains("/extrato")) return "FINANCEIRO";
        if(caminho.contains("/cotacoes")) return "COTACOES";
        if(caminho.contains("/maquinas")||caminho.contains("/usos-maquinas")) return "FROTA";
        if(caminho.contains("/insumos")||caminho.contains("/estoque")) return "ESTOQUE";
        if(caminho.contains("/contratos")||caminho.contains("/entregas")) return "CONTRATOS";
        if(caminho.contains("/clima")||caminho.contains("/localizacao")) return "CLIMA";
        if(caminho.contains("/romaneios")||caminho.contains("/documentos")) return "DOCUMENTOS";
        if(!caminho.contains("/agricola/") && !caminho.contains("/colaboracao/")) return "FINANCEIRO";
        return "PRODUCAO";
    }
    String funcaoAtual() {
        var contexto=RequestContextHolder.getRequestAttributes();
        return contexto instanceof ServletRequestAttributes r ? funcao(r.getRequest().getRequestURI()) : "PRODUCAO";
    }
    public Optional<Boolean> regra(Long empresa,String funcao,boolean escrita) {
        if(administrador()) return Optional.empty();
        var rows=db.queryForList("SELECT pode_ler,pode_escrever FROM agro_acessos_funcao WHERE empresa_id=? AND usuario_id=? AND funcionalidade=?",empresa,usuario(),funcao);
        if(rows.isEmpty()) return Optional.empty();
        boolean ler=Boolean.TRUE.equals(rows.getFirst().get("pode_ler"));
        return Optional.of(ler && (!escrita || Boolean.TRUE.equals(rows.getFirst().get("pode_escrever"))));
    }
    void exigirFuncao(Long empresa,boolean escrita) {
        if(regra(empresa,funcaoAtual(),escrita).filter(p->!p).isPresent()) throw new AccessDeniedException("Seu perfil não possui permissão para esta funcionalidade.");
    }
    public boolean restrito(Long empresa) {
        if(administrador()) return false;
        var valores=db.queryForList("SELECT restringir_propriedades FROM agro_acessos_usuario WHERE empresa_id=? AND usuario_id=?",Boolean.class,empresa,usuario());
        return !valores.isEmpty() && Boolean.TRUE.equals(valores.getFirst());
    }
    void propriedade(Long empresa,Long propriedade) {
        if(!restrito(empresa)) return;
        if(propriedade==null || db.queryForList("SELECT propriedade_id FROM agro_acessos_propriedade WHERE empresa_id=? AND usuario_id=? AND propriedade_id=? AND permitido=true",empresa,usuario(),propriedade).isEmpty()) throw new AccessDeniedException("Sem acesso a esta propriedade.");
    }
    List<Map<String,Object>> filtrar(Long empresa,List<Map<String,Object>> rows,String campo) {
        if(!restrito(empresa)) return rows;
        Set<Long> ids=new HashSet<>(db.queryForList("SELECT propriedade_id FROM agro_acessos_propriedade WHERE empresa_id=? AND usuario_id=? AND permitido=true",Long.class,empresa,usuario()));
        return rows.stream().filter(r->r.get(campo) instanceof Number n && ids.contains(n.longValue())).toList();
    }
    void porSafra(Long empresa,Long safra) {
        var props=db.queryForList("SELECT propriedade_id FROM safras_agro WHERE id=? AND empresa_id=?",Long.class,safra,empresa);
        if(props.isEmpty()) throw new IllegalArgumentException("Safra não encontrada nesta empresa.");propriedade(empresa,props.getFirst());
    }
    void porOperacao(Long empresa,Long operacao) {
        var props=db.queryForList("SELECT s.propriedade_id FROM operacoes_agro o JOIN safras_agro s ON s.id=o.safra_id WHERE o.id=? AND o.empresa_id=?",Long.class,operacao,empresa);
        if(props.isEmpty()) throw new IllegalArgumentException("Operação não encontrada nesta empresa.");propriedade(empresa,props.getFirst());
    }
    public Optional<Set<Long>> propriedadesPermitidas(Long empresa) {
        if(!restrito(empresa)) return Optional.empty();
        return Optional.of(new HashSet<>(db.queryForList("SELECT propriedade_id FROM agro_acessos_propriedade WHERE empresa_id=? AND usuario_id=? AND permitido=true",Long.class,empresa,usuario())));
    }
    void financeiro(Long empresa) {
        boolean padrao=Set.of("PRODUTOR","PROPRIETARIO","ADMINISTRADOR","SUPER_ADMIN").contains(jwt().getClaimAsString("papel"));
        if(!regra(empresa,"FINANCEIRO",true).orElse(padrao)) throw new AccessDeniedException("Seu perfil não pode registrar movimentos financeiros.");
    }
}
