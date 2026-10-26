package br.com.fluxocaixa.agricola;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.security.access.AccessDeniedException;
import jakarta.servlet.http.*;

@Configuration
public class AgroPermissoesWebConfig implements WebMvcConfigurer {
    private final PermissoesAgroService permissoes;
    public AgroPermissoesWebConfig(PermissoesAgroService permissoes) { this.permissoes=permissoes; }
    public boolean verificar(HttpServletRequest req) {
        if(req.getRequestURI().startsWith("/api/v1/contador/")) {
            Long empresa=Long.valueOf(permissoes.jwt().getClaims().get("empresaId").toString());
            if(permissoes.restrito(empresa) || permissoes.regra(empresa,"FINANCEIRO",false).filter(v->!v).isPresent()) throw new AccessDeniedException("Seu perfil não possui acesso à carteira e aos relatórios gerais.");
            return true;
        }
        var m=java.util.regex.Pattern.compile("/empresas/(\\d+)(?:/|$)").matcher(req.getRequestURI());
        if(!m.find() || "OPTIONS".equals(req.getMethod())) return true;
        Long empresa=Long.valueOf(m.group(1));String caminho=req.getRequestURI();String funcao=permissoes.funcao(caminho);
        if(caminho.contains("/agricola/acessos/")) return true;
        boolean escrita=!java.util.Set.of("GET","HEAD").contains(req.getMethod());
        if(permissoes.regra(empresa,funcao,escrita).filter(v->!v).isPresent()) throw new AccessDeniedException("Seu perfil não possui permissão para esta funcionalidade.");
        if(permissoes.restrito(empresa)) {
            boolean legado=caminho.contains("/colaboracao/") && !(caminho.endsWith("/propriedades") && "GET".equals(req.getMethod()));
            boolean financeiroGlobal=funcao.equals("FINANCEIRO") && !caminho.contains("/categorias");
            if(legado||financeiroGlobal||caminho.contains("/extrato")) throw new AccessDeniedException("Seu acesso está restrito a propriedades. Utilize os registros agrícolas autorizados; relatórios gerais exigem acesso completo.");
        }
        return true;
    }
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) { return verificar(request); }
        }).addPathPatterns("/api/v1/empresas/**","/api/v1/colaboracao/empresas/**","/api/v1/contador/**");
    }
}
