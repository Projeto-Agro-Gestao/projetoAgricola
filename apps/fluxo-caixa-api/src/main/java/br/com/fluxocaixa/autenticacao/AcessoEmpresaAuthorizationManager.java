package br.com.fluxocaixa.autenticacao;

import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
public class AcessoEmpresaAuthorizationManager
        implements AuthorizationManager<RequestAuthorizationContext> {

    @Override
    public AuthorizationResult authorize(
            Supplier<? extends Authentication> autenticacaoSupplier,
            RequestAuthorizationContext contexto) {

        Authentication autenticacao =
                autenticacaoSupplier.get();

        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || !(autenticacao.getPrincipal() instanceof Jwt jwt)) {

            return new AuthorizationDecision(false);
        }

        String empresaIdDoEndereco =
                contexto.getVariables().get("empresaId");

        Long empresaIdDoToken =
                obterEmpresaIdDoToken(jwt);

        if (empresaIdDoEndereco == null
                || empresaIdDoToken == null) {

            return new AuthorizationDecision(false);
        }

        try {
            Long empresaIdSolicitada =
                    Long.valueOf(empresaIdDoEndereco);

            boolean pertenceAMesmaEmpresa =
                    empresaIdSolicitada.equals(
                            empresaIdDoToken
                    );

            return new AuthorizationDecision(
                    pertenceAMesmaEmpresa
            );
        } catch (NumberFormatException exception) {

            return new AuthorizationDecision(false);
        }
    }

    private Long obterEmpresaIdDoToken(Jwt jwt) {

        Object empresaId = jwt
                .getClaims()
                .get("empresaId");

        if (empresaId instanceof Number numero) {
            return numero.longValue();
        }

        if (empresaId instanceof String texto) {

            try {
                return Long.valueOf(texto);
            } catch (NumberFormatException exception) {
                return null;
            }
        }

        return null;
    }
}