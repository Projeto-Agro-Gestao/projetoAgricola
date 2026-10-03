package br.com.fluxocaixa.autenticacao;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> ROTAS = Set.of("/api/v1/auth/login", "/api/v1/auth/google",
            "/api/v1/auth/cadastro", "/api/v1/auth/esqueci-senha", "/api/v1/auth/redefinir-senha");
    private final Map<String, Janela> janelas = new HashMap<>();
    private final Clock clock;
    private final int limite;
    private final int capacidade;
    private record Janela(long fim, int quantidade) { }

    public AuthRateLimitFilter() { this(Clock.systemUTC(), 30, 10000); }

    public AuthRateLimitFilter(Clock clock, int limite, int capacidade) {
        this.clock = clock;
        this.limite = limite;
        this.capacidade = capacidade;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !ROTAS.contains(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (!permitir(request.getRemoteAddr())) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setHeader("Cache-Control", "no-store");
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"mensagem\":\"Muitas tentativas. Aguarde um minuto e tente novamente.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private synchronized boolean permitir(String ip) {
        long agora = clock.millis();
        Janela janela = janelas.get(ip);
        if (janela == null || janela.fim() <= agora) {
            if (janelas.size() >= capacidade) {
                janelas.entrySet().removeIf(entry -> entry.getValue().fim() <= agora);
                if (!janelas.containsKey(ip) && janelas.size() >= capacidade) return false;
            }
            janelas.put(ip, new Janela(agora + 60000, 1));
            return true;
        }
        if (janela.quantidade() >= limite) return false;
        janelas.put(ip, new Janela(janela.fim(), janela.quantidade() + 1));
        return true;
    }
}
