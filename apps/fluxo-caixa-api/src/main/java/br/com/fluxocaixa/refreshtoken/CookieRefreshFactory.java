package br.com.fluxocaixa.refreshtoken;

import br.com.fluxocaixa.configuracao.PropriedadesSeguranca;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieRefreshFactory {

    private final PropriedadesSeguranca propriedadesSeguranca;

    public CookieRefreshFactory(
            PropriedadesSeguranca propriedadesSeguranca) {

        this.propriedadesSeguranca = propriedadesSeguranca;
    }

    public ResponseCookie emitir(
            String tokenCru,
            long ttlDias) {

        return base(tokenCru)
                .maxAge(Duration.ofDays(ttlDias))
                .build();
    }

    public ResponseCookie expirar() {

        return base("")
                .maxAge(0)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String valor) {

        PropriedadesSeguranca.Refresh refresh =
                propriedadesSeguranca.refresh();

        return ResponseCookie
                .from(refresh.nomeCookie(), valor)
                .httpOnly(true)
                .secure(true)
                .sameSite(refresh.sameSite())
                .path(refresh.path());
    }
}
