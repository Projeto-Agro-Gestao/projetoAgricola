package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.usuario.UsuarioRepository;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class VersaoAutenticacaoTokenValidator implements OAuth2TokenValidator<Jwt> {
    private final UsuarioRepository usuarios;

    public VersaoAutenticacaoTokenValidator(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        try {
            Object claim = jwt.getClaim("versaoAutenticacao");
            long versao = claim == null ? 0 : Long.parseLong(claim.toString());
            if (usuarios.buscarVersaoAutenticacao(Long.valueOf(jwt.getSubject()))
                    .filter(atual -> atual == versao).isPresent()) {
                return OAuth2TokenValidatorResult.success();
            }
        } catch (NumberFormatException exception) {
            // Tokens com identidade ou versao malformada nao sao aceitos.
        }
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Sessao invalidada.", null));
    }
}
