package br.com.fluxocaixa.agricola;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola/acessos")
public class PermissoesAgroController {
    private final AgricolaService acesso;
    private final PermissoesAgroService permissoes;
    private final JdbcTemplate db;
    public PermissoesAgroController(AgricolaService acesso,PermissoesAgroService permissoes,JdbcTemplate db) {this.acesso=acesso;this.permissoes=permissoes;this.db=db;}
    public record Regra(@NotBlank String funcionalidade,boolean podeLer,boolean podeEscrever) {}
    public record Configuracao(boolean restringirPropriedades,@NotNull @Size(max=1000) List<@NotNull @Positive Long> propriedades,
            @NotNull @Size(max=8) List<@NotNull @Valid Regra> regras) {}
    private void admin(Long empresa) { acesso.acesso(empresa);if(!permissoes.administrador()) throw new AccessDeniedException("Apenas proprietário ou administrador pode configurar permissões."); }
    @GetMapping("/meu") public Map<String,Object> meu(@PathVariable Long empresaId) {
        // A leitura da própria configuração não depende de uma permissão funcional específica.
        if(!String.valueOf(empresaId).equals(String.valueOf(permissoes.jwt().getClaims().get("empresaId")))) throw new AccessDeniedException("Sem acesso à empresa.");
        boolean padrao=Set.of("PRODUTOR","PROPRIETARIO","ADMINISTRADOR","SUPER_ADMIN").contains(permissoes.jwt().getClaimAsString("papel"));
        List<Map<String,Object>> regras=PermissoesAgroService.FUNCOES.stream().sorted().map(f->Map.<String,Object>of("funcionalidade",f,"podeLer",permissoes.regra(empresaId,f,false).orElse(true),"podeEscrever",permissoes.regra(empresaId,f,true).orElse(padrao))).toList();
        return Map.of("administrar",permissoes.administrador(),"restrito",permissoes.restrito(empresaId),"regras",regras);
    }
    @GetMapping("/usuarios") public List<Map<String,Object>> usuarios(@PathVariable Long empresaId) {
        admin(empresaId);return db.queryForList("SELECT id,nome,papel,ativo FROM usuarios WHERE empresa_id=? ORDER BY nome",empresaId);
    }
    @GetMapping("/usuarios/{usuarioId}") public Map<String,Object> ler(@PathVariable Long empresaId,@PathVariable Long usuarioId) {
        admin(empresaId);
        if(db.queryForList("SELECT id FROM usuarios WHERE id=? AND empresa_id=?",usuarioId,empresaId).isEmpty()) throw new IllegalArgumentException("Usuário não encontrado nesta empresa.");
        var config=db.queryForList("SELECT restringir_propriedades FROM agro_acessos_usuario WHERE empresa_id=? AND usuario_id=?",Boolean.class,empresaId,usuarioId);
        return Map.of("restringirPropriedades",!config.isEmpty()&&config.getFirst(),"propriedades",db.queryForList("SELECT propriedade_id FROM agro_acessos_propriedade WHERE empresa_id=? AND usuario_id=? AND permitido=true",Long.class,empresaId,usuarioId),"regras",db.queryForList("SELECT funcionalidade,pode_ler,pode_escrever FROM agro_acessos_funcao WHERE empresa_id=? AND usuario_id=?",empresaId,usuarioId));
    }
    @PutMapping("/usuarios/{usuarioId}") @Transactional public Map<String,Object> salvar(@PathVariable Long empresaId,@PathVariable Long usuarioId,@Valid @RequestBody Configuracao r) {
        admin(empresaId);
        var usuario=db.queryForList("SELECT papel FROM usuarios WHERE id=? AND empresa_id=? FOR UPDATE",usuarioId,empresaId);
        if(usuario.isEmpty()) throw new IllegalArgumentException("Usuário não encontrado nesta empresa.");
        if(Set.of("ADMINISTRADOR","SUPER_ADMIN","PROPRIETARIO").contains(usuario.getFirst().get("papel").toString())) throw new IllegalArgumentException("As permissões administrativas são preservadas e não podem ser reduzidas nesta tela.");
        Set<String> funcoes=new HashSet<>();
        for(var regra:r.regras()) if(!PermissoesAgroService.FUNCOES.contains(regra.funcionalidade()) || !funcoes.add(regra.funcionalidade()) || regra.podeEscrever()&&!regra.podeLer()) throw new IllegalArgumentException("Regras de acesso inválidas ou repetidas.");
        for(Long prop:r.propriedades()) if(db.queryForList("SELECT id FROM propriedades_rurais WHERE id=? AND empresa_id=?",prop,empresaId).isEmpty()) throw new IllegalArgumentException("Propriedade não pertence a esta empresa.");
        int alteradas=db.update("UPDATE agro_acessos_usuario SET restringir_propriedades=? WHERE empresa_id=? AND usuario_id=?",r.restringirPropriedades(),empresaId,usuarioId);
        if(alteradas==0) db.update("INSERT INTO agro_acessos_usuario(empresa_id,usuario_id,restringir_propriedades) VALUES(?,?,?)",empresaId,usuarioId,r.restringirPropriedades());
        db.update("UPDATE agro_acessos_propriedade SET permitido=false WHERE empresa_id=? AND usuario_id=?",empresaId,usuarioId);
        for(Long prop:new HashSet<>(r.propriedades())) {
            int atualizadas=db.update("UPDATE agro_acessos_propriedade SET permitido=true WHERE empresa_id=? AND usuario_id=? AND propriedade_id=?",empresaId,usuarioId,prop);
            if(atualizadas==0) db.update("INSERT INTO agro_acessos_propriedade(empresa_id,usuario_id,propriedade_id,permitido) VALUES(?,?,?,true)",empresaId,usuarioId,prop);
        }
        for(var regra:r.regras()) {
            int atualizadas=db.update("UPDATE agro_acessos_funcao SET pode_ler=?,pode_escrever=? WHERE empresa_id=? AND usuario_id=? AND funcionalidade=?",regra.podeLer(),regra.podeEscrever(),empresaId,usuarioId,regra.funcionalidade());
            if(atualizadas==0) db.update("INSERT INTO agro_acessos_funcao(empresa_id,usuario_id,funcionalidade,pode_ler,pode_escrever) VALUES(?,?,?,?,?)",empresaId,usuarioId,regra.funcionalidade(),regra.podeLer(),regra.podeEscrever());
        }
        acesso.auditar(empresaId,"CONFIGURAR_PERMISSOES",usuarioId);return Map.of("salvo",true);
    }
}
